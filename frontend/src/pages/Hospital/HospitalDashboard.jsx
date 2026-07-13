import { useState, useEffect } from 'react'
import { Building2, ClipboardList, Route } from 'lucide-react'
import Layout from '../../components/Layout'
import BloodTypeTag from '../../components/BloodTypeTag'
import StatusBadge from '../../components/StatusBadge'
import { api } from '../../services/api'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function HospitalDashboard() {
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [nearbyBanks, setNearbyBanks] = useState([])
  const [bankStock, setBankStock] = useState({})
  const [reqForm, setReqForm] = useState({ blood_type: 'O+', units: 1, urgency: 'normal', notes: '' })
  const [traceForm, setTraceForm] = useState({ donation_id: '', patient_request_id: '', blood_type: 'O+', units: 1, message: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.getHospitalRequests().then(r => setRequests(Array.isArray(r) ? r : []))
    api.getNearbyBanks().then(b => setNearbyBanks(Array.isArray(b) ? b : []))
  }, [])

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
      const res = await api.requestBloodHospital({ ...reqForm, units: parseInt(reqForm.units) })
      if (res.id) { setMsg('Request submitted successfully.'); api.getHospitalRequests().then(r => setRequests(Array.isArray(r) ? r : [])) }
      else setMsg(errMsg(res.detail))
    } catch { setMsg('Network error. Is the server running?') }
    setLoading(false)
  }

  const traceBlood = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.traceBlood({ ...traceForm, units: parseInt(traceForm.units) })
      if (res.journey_id) setMsg(`Blood traced. Journey ID: ${res.journey_id}. Patient notified.`)
      else setMsg(errMsg(res.detail))
    } catch { setMsg('Network error. Is the server running?') }
    setLoading(false)
  }

  const toggleStock = async (bankId) => {
    if (bankStock[bankId]) { setBankStock(s => ({ ...s, [bankId]: null })); return }
    const stock = await api.getBankStock(bankId)
    setBankStock(s => ({ ...s, [bankId]: Array.isArray(stock) ? stock : [] }))
  }

  const inputCls = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-red-400 focus:bg-white/10 transition-colors"

  return (
    <Layout role="hospital" activeTab={tab} setTab={t => { setTab(t); setMsg('') }}>

      {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-5 py-3 rounded-xl mb-5">{msg}</div>}

      {/* ── MY REQUESTS ── */}
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
              <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">No blood requests yet.</p>
            </div>
          )}
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="bg-panel rounded-2xl border border-white/10 p-5 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BloodTypeTag type={r.blood_type} />
                      <span className="text-sm font-semibold text-zinc-200">{r.units} units</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-zinc-500 capitalize">{r.urgency} · {r.notes}</p>
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
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Units</label>
                  <input type="number" min="1" value={reqForm.units}
                    onChange={e => setReqForm(f => ({ ...f, units: e.target.value }))} className={inputCls} />
                </div>
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
                  rows={3} placeholder="Additional context..." className={inputCls + ' resize-none'} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── BLOOD BANKS ── */}
      {tab === 'blood-banks' && (
        <div>
          <h2 className="text-lg font-bold text-zinc-100 mb-5">Nearby Blood Banks</h2>
          <div className="space-y-3">
            {nearbyBanks.map(b => (
              <div key={b.id} className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Building2 size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100">{b.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{b.city}, {b.state}
                        {b.distance_km && <span className="ml-2 text-blue-500 font-medium">{b.distance_km.toFixed(1)} km away</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleStock(b.id)}
                    className={`text-xs px-4 py-2 rounded-xl font-semibold transition-colors
                      ${bankStock[b.id] ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-400 hover:bg-red-500/15 hover:text-red-400'}`}>
                    {bankStock[b.id] ? 'Hide Stock' : 'View Stock'}
                  </button>
                </div>
                {bankStock[b.id] && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {bankStock[b.id].map(s => (
                        <div key={s.blood_type} className={`rounded-xl p-3 text-center border ${s.units < 10 ? 'bg-red-500/10 border-red-500/30' : 'bg-ink border-white/10'}`}>
                          <BloodTypeTag type={s.blood_type} />
                          <p className={`text-sm font-bold mt-2 ${s.units < 10 ? 'text-red-400' : 'text-zinc-300'}`}>{s.units}</p>
                          <p className="text-xs text-zinc-500">units</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRACE BLOOD ── */}
      {tab === 'trace-blood' && (
        <div className="max-w-xl">
          <h2 className="text-lg font-bold text-zinc-100 mb-2">Trace Blood to Patient</h2>
          <p className="text-sm text-zinc-500 mb-6">Link a donation record to a patient request. This creates a blood journey and notifies the patient.</p>
          <div className="bg-panel rounded-2xl border border-white/10 p-7 shadow-sm">
            <form onSubmit={traceBlood} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Donation ID</label>
                <input value={traceForm.donation_id} onChange={e => setTraceForm(f => ({ ...f, donation_id: e.target.value }))}
                  placeholder="e.g. abc123..." className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Patient Request ID</label>
                <input value={traceForm.patient_request_id} onChange={e => setTraceForm(f => ({ ...f, patient_request_id: e.target.value }))}
                  placeholder="e.g. def456..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Blood Type</label>
                  <select value={traceForm.blood_type} onChange={e => setTraceForm(f => ({ ...f, blood_type: e.target.value }))} className={inputCls}>
                    {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Units</label>
                  <input type="number" min="1" value={traceForm.units}
                    onChange={e => setTraceForm(f => ({ ...f, units: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Message to Patient</label>
                <textarea value={traceForm.message} onChange={e => setTraceForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Optional message..." rows={2} className={inputCls + ' resize-none'} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? 'Tracing...' : 'Trace Blood & Notify Patient'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
