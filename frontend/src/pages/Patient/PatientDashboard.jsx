import { useState, useEffect } from 'react'
import { Droplets, Route, Clock, ArrowLeft, Building2, Search, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

const DISEASE_INTERVAL = {
  thalassemia: 21, sickle_cell: 45, hemophilia: 10,
  aplastic_anemia: 10, anemia: 30, other: 28,
}

function TransfusionCountdown({ profile }) {
  if (!profile?.next_transfusion_date) return null
  const next = new Date(profile.next_transfusion_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  next.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((next - today) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  const isSoon = daysLeft <= 3 && daysLeft >= 0
  const intervalDays = DISEASE_INTERVAL[profile.disease] || 28

  return (
    <div className={`rounded-2xl p-5 mb-6 border shadow-sm ${
      isOverdue ? 'bg-red-500/10 border-red-500/30' :
      isSoon    ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOverdue ? 'bg-red-500/15' : isSoon ? 'bg-orange-500/15' : 'bg-blue-500/15'
          }`}>
            {isOverdue ? <AlertTriangle size={20} className="text-red-400" /> :
             isSoon    ? <Clock size={20} className="text-orange-500" /> :
                         <Calendar size={20} className="text-blue-500" />}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              isOverdue ? 'text-red-500' : isSoon ? 'text-orange-500' : 'text-blue-500'
            }`}>Next Transfusion</p>
            <p className={`text-lg font-bold ${
              isOverdue ? 'text-red-400' : isSoon ? 'text-orange-400' : 'text-blue-400'
            }`}>
              {isOverdue
                ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
                : daysLeft === 0
                ? 'Today'
                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} away`}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {intervalDays && ` · every ~${intervalDays} days`}
            </p>
          </div>
        </div>
        {!isOverdue && daysLeft <= 7 && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
            isSoon ? 'bg-orange-200 text-orange-400' : 'bg-blue-500/25 text-blue-400'
          }`}>Contact your hospital</span>
        )}
        {isOverdue && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500/25 text-red-400">Urgent — call hospital</span>
        )}
      </div>
    </div>
  )
}
import Layout from '../../components/Layout'
import BloodTypeTag from '../../components/BloodTypeTag'
import StatusBadge from '../../components/StatusBadge'
import { api } from '../../services/api'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const COMPONENTS = ['Packed Red Blood Cells', 'Whole Blood', 'Fresh Frozen Plasma', 'Platelet Concentrate', 'Single Donor Platelet', 'Random Donor Platelets', 'Cryoprecipitate', 'Plasma']

export default function PatientDashboard() {
  const [tab, setTab] = useState('requests')
  const [profile, setProfile] = useState(null)
  const [requests, setRequests] = useState([])
  const [journeys, setJourneys] = useState([])
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [reqForm, setReqForm] = useState({ blood_type: 'O+', units: 1, hospital_name: '', urgency: 'normal', notes: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [bankResults, setBankResults] = useState([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankFilter, setBankFilter] = useState({ state: '', component: 'Packed Red Blood Cells' })

  useEffect(() => {
    api.getPatientProfile().then(p => {
      setProfile(p)
      if (p?.blood_type) {
        api.nationalSearch({ blood_group: p.blood_type, component: 'Packed Red Blood Cells', limit: 10 })
          .then(r => setBankResults(Array.isArray(r) ? r : []))
      }
    })
    api.getPatientRequests().then(r => setRequests(Array.isArray(r) ? r : []))
    api.getPatientJourneys().then(j => setJourneys(Array.isArray(j) ? j : []))
  }, [])

  const searchBanks = () => {
    if (!profile?.blood_type) return
    setBankLoading(true)
    api.nationalSearch({ blood_group: profile.blood_type, ...bankFilter, limit: 20 })
      .then(r => { setBankResults(Array.isArray(r) ? r : []); setBankLoading(false) })
  }

  const errMsg = (detail) => {
    if (!detail) return 'Request failed'
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map(e => e.msg || JSON.stringify(e)).join(', ')
    return JSON.stringify(detail)
  }

  const submitRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.requestBlood({ ...reqForm, units: parseInt(reqForm.units) })
      if (res.id) {
        setMsg('Blood request submitted successfully.')
        api.getPatientRequests().then(r => setRequests(Array.isArray(r) ? r : []))
      } else setMsg(errMsg(res.detail))
    } catch { setMsg('Network error. Is the server running?') }
    setLoading(false)
  }

  const openJourney = async (j) => {
    setSelectedJourney(j)
    if (j.chat_accepted) {
      const msgs = await api.getMessages(j.id)
      setChatMessages(Array.isArray(msgs) ? msgs : [])
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedJourney) return
    await api.sendMessage(selectedJourney.id, chatInput)
    setChatInput('')
    const msgs = await api.getMessages(selectedJourney.id)
    setChatMessages(Array.isArray(msgs) ? msgs : [])
  }

  const inputCls = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-red-400 focus:bg-white/10 transition-colors"

  return (
    <Layout role="patient" activeTab={tab} setTab={t => { setTab(t); setMsg(''); setSelectedJourney(null) }}>

      {profile && (
        <div className="bg-panel rounded-2xl border border-white/10 p-5 mb-6 flex justify-between items-center shadow-sm">
          <div>
            <p className="font-bold text-zinc-100 text-lg">{profile.name || localStorage.getItem('vt_name')}</p>
            <p className="text-sm text-zinc-500 capitalize mt-0.5">{profile.disease?.replace(/_/g, ' ')} · {profile.city}, {profile.state}</p>
          </div>
          <div className="flex items-center gap-3">
            <BloodTypeTag type={profile.blood_type} />
          </div>
        </div>
      )}

      <TransfusionCountdown profile={profile} />

      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-5 py-3 rounded-xl mb-5">{msg}</div>
      )}

      {/* ── REQUESTS ── */}
      {tab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-zinc-100">Blood Requests</h2>
            <button onClick={() => setTab('new-request')}
              className="bg-red-600 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors">
              + New Request
            </button>
          </div>
          {requests.length === 0 && (
            <div className="bg-panel rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Droplets size={24} className="text-red-300" />
              </div>
              <p className="text-zinc-500 text-sm">No requests yet. Create your first blood request.</p>
            </div>
          )}
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="bg-panel rounded-2xl border border-white/10 p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Droplets size={18} className="text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BloodTypeTag type={r.blood_type} />
                      <span className="text-sm font-semibold text-zinc-200">{r.units} units</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-zinc-500">{r.hospital_name} · {r.urgency}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NEW REQUEST ── */}
      {tab === 'new-request' && (
        <div className="max-w-xl">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Request Blood</h2>
          <div className="bg-panel rounded-2xl border border-white/10 p-7 shadow-sm">
            <form onSubmit={submitRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Blood Type</label>
                  <select value={reqForm.blood_type} onChange={e => setReqForm(f => ({ ...f, blood_type: e.target.value }))} className={inputCls}>
                    {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Units Needed</label>
                  <input type="number" min="1" max="20" value={reqForm.units}
                    onChange={e => setReqForm(f => ({ ...f, units: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Hospital</label>
                <input value={reqForm.hospital_name} onChange={e => setReqForm(f => ({ ...f, hospital_name: e.target.value }))}
                  placeholder="e.g. Apollo Hospital, Hyderabad" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Urgency</label>
                <select value={reqForm.urgency} onChange={e => setReqForm(f => ({ ...f, urgency: e.target.value }))} className={inputCls}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical — Life Threatening</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Notes</label>
                <textarea value={reqForm.notes} onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional details..." rows={3} className={inputCls + ' resize-none'} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit Blood Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── JOURNEY LIST ── */}
      {tab === 'journey' && !selectedJourney && (
        <div>
          <h2 className="text-lg font-bold text-zinc-100 mb-5">Blood Journey</h2>
          {journeys.length === 0 && (
            <div className="bg-panel rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Route size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">No journeys yet. Your blood journey will appear here once a hospital traces a donation to you.</p>
            </div>
          )}
          <div className="space-y-3">
            {journeys.map(j => (
              <button key={j.id} onClick={() => openJourney(j)}
                className="w-full bg-panel rounded-2xl border border-white/10 p-5 text-left hover:border-red-500/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                      <Route size={18} className="text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BloodTypeTag type={j.blood_type} />
                        <StatusBadge status={j.status} />
                        {j.chat_accepted && (
                          <span className="text-xs bg-green-500/15 text-green-400 font-semibold px-2 py-0.5 rounded-lg">Chat Open</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">Donor: {j.donor_name || 'Anonymous'}</p>
                    </div>
                  </div>
                  <span className="text-zinc-600 text-lg">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── JOURNEY DETAIL ── */}
      {tab === 'journey' && selectedJourney && (
        <div className="max-w-xl">
          <button onClick={() => setSelectedJourney(null)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-5 transition-colors">
            <ArrowLeft size={14} /> Back to journeys
          </button>
          <div className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <BloodTypeTag type={selectedJourney.blood_type} />
              <StatusBadge status={selectedJourney.status} />
              <span className="text-sm text-zinc-400 ml-1">Donor: {selectedJourney.donor_name || 'Anonymous'}</span>
            </div>
            {selectedJourney.chat_accepted ? (
              <>
                <div className="h-72 overflow-y-auto p-5 space-y-3 bg-ink">
                  {chatMessages.length === 0 && <p className="text-center text-xs text-zinc-500">Start the conversation</p>}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`p-3.5 rounded-2xl text-sm max-w-[78%] leading-relaxed
                      ${m.sender_role === 'patient' ? 'bg-red-600 text-white ml-auto rounded-br-sm' : 'bg-panel border text-zinc-300 rounded-bl-sm'}`}>
                      {m.content}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t flex gap-3">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Send a message to your donor..."
                    className="flex-1 bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400" />
                  <button onClick={sendChat} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700">
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">Waiting for donor to accept the chat request.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BLOOD BANKS ── */}
      {tab === 'blood-banks' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Find Blood Near You</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Live stock from 4,443 hospitals across India (eRaktKosh)</p>
            </div>
            {profile?.blood_type && <BloodTypeTag type={profile.blood_type} />}
          </div>

          <div className="bg-panel rounded-2xl border border-white/10 p-5 mb-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">State</label>
                <input value={bankFilter.state}
                  onChange={e => setBankFilter(f => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Karnataka, Delhi"
                  className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:bg-white/10 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">Component</label>
                <select value={bankFilter.component}
                  onChange={e => setBankFilter(f => ({ ...f, component: e.target.value }))}
                  className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:bg-white/10 transition-colors">
                  {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={searchBanks} disabled={bankLoading}
                  className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Search size={14} />
                  {bankLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {bankResults.length === 0 && !bankLoading && (
            <div className="bg-panel rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Building2 size={24} className="text-red-300" />
              </div>
              <p className="text-zinc-500 text-sm">No results. Try a different state or component.</p>
            </div>
          )}

          <div className="space-y-3">
            {bankResults.map((b, i) => (
              <div key={i} className="bg-panel rounded-2xl border border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 size={16} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-200 text-sm leading-snug truncate">{b.hospital_name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{b.district}, {b.state}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{b.component} · Updated {b.last_updated?.split(' ')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <BloodTypeTag type={b.blood_group} />
                    </div>
                    <p className="text-lg font-bold text-red-400 mt-1">{b.availability}</p>
                    <p className="text-xs text-zinc-500">units</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </Layout>
  )
}
