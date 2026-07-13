import { useState, useEffect, useMemo, useRef } from 'react'
import { Droplets, Heart, Syringe, Gift, ClipboardList, Route, Bell, Clock, CheckCircle, AlertTriangle, Trophy, MessageCircle, Send } from 'lucide-react'
import Layout from '../../components/Layout'
import BloodTypeTag from '../../components/BloodTypeTag'
import { api } from '../../services/api'

const BADGE_STYLES = {
  'First Drop': { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', barColor: 'bg-blue-500' },
  'Lifesaver':  { cls: 'bg-purple-500/15 text-purple-400 border-purple-200', barColor: 'bg-purple-500' },
  'Hero':       { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', barColor: 'bg-yellow-500' },
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

const RANKS = [
  { min: 0,   max: 0,   name: 'Aspiring Soul',  color: 'text-zinc-400',   bg: 'bg-white/10' },
  { min: 1,   max: 1,   name: 'First Drop',      color: 'text-blue-600',   bg: 'bg-blue-500/15' },
  { min: 2,   max: 4,   name: 'Spark of Life',   color: 'text-teal-600',   bg: 'bg-teal-100' },
  { min: 5,   max: 9,   name: 'Guardian Angel',  color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { min: 10,  max: 24,  name: 'Lifesaver',       color: 'text-purple-600', bg: 'bg-purple-500/15' },
  { min: 25,  max: 49,  name: 'Hero',            color: 'text-yellow-600', bg: 'bg-yellow-500/15' },
  { min: 50,  max: 99,  name: 'Champion',        color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { min: 100, max: Infinity, name: 'Legend',     color: 'text-red-400',    bg: 'bg-red-500/15'  },
]

function getRank(donations) {
  return RANKS.find(r => donations >= r.min && donations <= r.max) || RANKS[0]
}

const IMPACT_QUOTES = [
  "Every drop you gave carried someone's prayer for one more day.",
  "Your blood didn't just save a life — it gave a parent more mornings with their child.",
  "The courage it takes to roll up your sleeve rewrites someone's story entirely.",
  "Somewhere tonight, a family sleeps peacefully because you said yes.",
  "Your generosity lives on in someone's veins — a gift that never stops giving.",
  "That one hour you gave may have bought someone decades more.",
  "You didn't just donate blood — you donated hope when hope was running out.",
  "A thalassemia child smiles today because heroes like you show up.",
  "In a world where you could be anything — you chose to be a lifesaver.",
  "Your blood type is rare. But your kindness? That's what truly saves lives.",
  "They may never know your name, but they carry a piece of your spirit.",
  "One decision. One hour. One life changed forever — yours included.",
  "Blood is the river of life, and you chose to share yours.",
  "You walked in as a donor. You walked out as someone's miracle.",
  "What feels ordinary to you is extraordinary to the one who needed it.",
]

// 56-day gap for whole blood (WHO / Indian NBTC standard)
const DONATION_GAP_DAYS = 56

function DonationReadinessCard({ profile, totalDonations }) {
  if (!profile) return null
  const lastDate = profile.last_donation_date ? new Date(profile.last_donation_date) : null
  const today = new Date(); today.setHours(0, 0, 0, 0)

  if (!lastDate) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div>
            <p className="font-bold text-green-300">Ready to donate</p>
            <p className="text-xs text-green-400">No previous donation recorded — you're eligible now</p>
          </div>
        </div>
      </div>
    )
  }

  lastDate.setHours(0, 0, 0, 0)
  const nextEligible = new Date(lastDate)
  nextEligible.setDate(nextEligible.getDate() + DONATION_GAP_DAYS)
  const daysLeft = Math.round((nextEligible - today) / (1000 * 60 * 60 * 24))
  const isReady = daysLeft <= 0

  return (
    <div className={`rounded-2xl p-5 mb-6 border ${isReady ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReady ? 'bg-green-500/15' : 'bg-orange-500/15'}`}>
            {isReady
              ? <CheckCircle size={20} className="text-green-400" />
              : <Clock size={20} className="text-orange-500" />}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isReady ? 'text-green-500' : 'text-orange-500'}`}>
              Donation Eligibility
            </p>
            <p className={`text-lg font-bold ${isReady ? 'text-green-400' : 'text-orange-400'}`}>
              {isReady
                ? 'Ready to donate again!'
                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until eligible`}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Last donated: {lastDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {!isReady && ` · Eligible from ${nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`}
            </p>
          </div>
        </div>
        {isReady && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-green-500/25 text-green-400">Go donate!</span>
        )}
      </div>
    </div>
  )
}

export default function DonorDashboard() {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [impact, setImpact] = useState(null)
  const [history, setHistory] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [journeys, setJourneys] = useState([])
  const [banks, setBanks] = useState([])
  const [donateForm, setDonateForm] = useState({ blood_bank_id: '', units: 1 })
  const [bankSearch, setBankSearch] = useState('')
  const [bankResults, setBankResults] = useState([])
  const [selectedBankName, setSelectedBankName] = useState('')
  const [showBankDrop, setShowBankDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [chatJourney, setChatJourney] = useState(null)
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef(null)
  const quote = useMemo(() => IMPACT_QUOTES[Math.floor(Math.random() * IMPACT_QUOTES.length)], [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [chatMsgs])

  useEffect(() => {
    api.getDonorProfile().then(setProfile)
    api.getDonorJourneys().then(j => setJourneys(Array.isArray(j) ? j : []))
    api.getDonorImpact().then(setImpact)
    api.getDonorHistory().then(h => setHistory(Array.isArray(h) ? h : []))
    api.getLeaderboard().then(l => setLeaderboard(Array.isArray(l) ? l : []))
  }, [])

  useEffect(() => {
    if (!showBankDrop) return
    const t = setTimeout(() => {
      api.searchBanks(bankSearch).then(r => setBankResults(Array.isArray(r) ? r : []))
    }, 250)
    return () => clearTimeout(t)
  }, [bankSearch, showBankDrop])

  const errMsg = (detail) => {
    if (!detail) return 'Request failed'
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map(e => e.msg || JSON.stringify(e)).join(', ')
    return JSON.stringify(detail)
  }

  const donate = async (e) => {
    e.preventDefault()
    if (!donateForm.blood_bank_id) { setMsg('Please select a blood bank.'); return }
    setLoading(true)
    try {
      const res = await api.recordDonation({
        bank_id: donateForm.blood_bank_id,
        quantity: parseInt(donateForm.units),
        blood_type: profile?.blood_type || 'O+',
      })
      if (res.donation_id) {
        setMsg(`Donation recorded! +${res.points_earned || 0} points earned.`)
        api.getDonorProfile().then(setProfile)
        api.getDonorHistory().then(h => setHistory(Array.isArray(h) ? h : []))
        api.getLeaderboard().then(l => setLeaderboard(Array.isArray(l) ? l : []))
      } else setMsg(errMsg(res.detail))
    } catch { setMsg('Network error. Is the server running?') }
    setLoading(false)
  }

  const respondJourney = async (id, action) => {
    const res = action === 'accept' ? await api.acceptJourney(id) : await api.declineJourney(id)
    setMsg(action === 'accept' ? 'Journey accepted! +25 points. You can now chat with the patient.' : res.message || 'Done')
    api.getDonorProfile().then(setProfile)
    api.getDonorJourneys().then(j => setJourneys(Array.isArray(j) ? j : []))
  }

  const openChat = async (j) => {
    setChatJourney(j)
    const m = await api.getMessages(j.id)
    setChatMsgs(Array.isArray(m) ? m : [])
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || !chatJourney) return
    setChatInput('')
    const res = await api.sendMessage(chatJourney.id, text)
    if (res.id) setChatMsgs(m => [...m, res])
  }

  const inputCls = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-red-400 focus:bg-white/10 transition-colors"

  const badge = profile?.badge
  const badgeStyle = BADGE_STYLES[badge] || null

  return (
    <Layout role="donor" activeTab={tab} setTab={t => { setTab(t); setMsg('') }} badge={journeys.filter(j => !j.chat_accepted).length}>

      {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-5 py-3 rounded-xl mb-5">{msg}</div>}

      {/* ── PROFILE / IMPACT ── */}
      {tab === 'profile' && (
        <div>
          <DonationReadinessCard profile={profile} totalDonations={impact?.total_donations || 0} />

          {/* Empathetic quote */}
          {impact?.total_donations > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-500/20 rounded-2xl px-6 py-5 mb-6">
              <p className="text-sm text-zinc-400 font-semibold mb-1 uppercase tracking-wide">Your impact</p>
              <p className="text-zinc-300 text-sm leading-relaxed italic">"{quote}"</p>
            </div>
          )}

          {profile && (
            <div className="bg-gradient-to-br from-red-600 to-rose-500 rounded-3xl p-8 text-white mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-200 text-sm mb-1">Welcome back</p>
                  <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                  <p className="text-red-200 text-sm">{profile.city}, {profile.state}</p>
                  {badge && badgeStyle && (
                    <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1.5 rounded-xl bg-panel/20 text-white border border-white/30">
                      {badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <BloodTypeTag type={profile.blood_type} />
                  <div className="mt-4">
                    <p className="text-4xl font-bold">{profile.points || 0}</p>
                    <p className="text-red-200 text-xs">points</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {impact && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Donations', val: impact.total_donations, icon: Droplets, color: 'text-red-500', bg: 'bg-red-500/10' },
                { label: 'Lives Impacted', val: impact.lives_impacted, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
                { label: 'Units Donated', val: impact.total_units, icon: Syringe, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-panel rounded-2xl border border-white/10 p-5 text-center shadow-sm">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={18} className={s.color} />
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{s.val || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-panel rounded-2xl border border-white/10 p-6 shadow-sm">
            <h3 className="font-bold text-zinc-100 mb-4">Badge Progress</h3>
            <div className="space-y-4">
              {[
                { name: 'First Drop', barColor: 'bg-blue-500', req: 1, label: '1 donation' },
                { name: 'Lifesaver', barColor: 'bg-purple-500', req: 10, label: '10 donations' },
                { name: 'Hero', barColor: 'bg-yellow-500', req: 25, label: '25 donations' },
              ].map(b => {
                const donations = impact?.total_donations || 0
                const progress = Math.min(100, (donations / b.req) * 100)
                const earned = donations >= b.req
                return (
                  <div key={b.name} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${earned ? b.barColor : 'bg-white/10'}`}>
                      {b.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className={`text-sm font-semibold ${earned ? 'text-zinc-100' : 'text-zinc-500'}`}>{b.name}</p>
                        <p className="text-xs text-zinc-500">{b.label}</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${earned ? b.barColor : 'bg-gray-300'}`}
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {earned && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">Earned</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DONATE ── */}
      {tab === 'donate' && (
        <div className="max-w-xl">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Record a Donation</h2>
          <div className="bg-panel rounded-2xl border border-white/10 p-7 shadow-sm">
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-400">
              <Gift size={16} className="shrink-0" />
              <span>First donation: <strong>100 pts</strong> · Each after: <strong>50 pts</strong> · Journey accept: <strong>25 pts</strong></span>
            </div>
            <form onSubmit={donate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Blood Bank</label>
                <div className="relative">
                  <input
                    value={selectedBankName || bankSearch}
                    onChange={e => {
                      setBankSearch(e.target.value)
                      setSelectedBankName('')
                      setDonateForm(f => ({ ...f, blood_bank_id: '' }))
                      setShowBankDrop(true)
                    }}
                    onFocus={() => setShowBankDrop(true)}
                    onBlur={() => setTimeout(() => setShowBankDrop(false), 150)}
                    placeholder="Search hospital name..."
                    className={inputCls}
                  />
                  {showBankDrop && (
                    <div className="absolute z-50 w-full mt-1 bg-panel border border-white/10 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {bankResults.length === 0 && bankSearch.length > 0 && (
                        <p className="text-xs text-zinc-500 px-4 py-3">No hospitals found</p>
                      )}
                      {bankSearch.length === 0 && bankResults.length === 0 && (
                        <p className="text-xs text-zinc-500 px-4 py-3">Type to search 4,114 real blood banks...</p>
                      )}
                      {bankResults.map(b => (
                        <button key={b.id} type="button"
                          onMouseDown={() => {
                            setDonateForm(f => ({ ...f, blood_bank_id: b.id }))
                            setSelectedBankName(`${b.name} — ${b.city || b.state}`)
                            setBankSearch('')
                            setShowBankDrop(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/15 hover:text-red-400 transition-colors border-b border-white/10 last:border-0">
                          <p className="font-medium">{b.name}</p>
                          <p className="text-xs text-zinc-500">{b.city}{b.state ? `, ${b.state}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {donateForm.blood_bank_id && (
                    <p className="text-xs text-green-400 mt-1">Selected: {selectedBankName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">Units Donated</label>
                <input type="number" min="1" max="5" value={donateForm.units}
                  onChange={e => setDonateForm(f => ({ ...f, units: e.target.value }))} className={inputCls} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? 'Recording...' : 'Record Donation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div>
          <h2 className="text-lg font-bold text-zinc-100 mb-5">Donation History</h2>
          {history.length === 0 && (
            <div className="bg-panel rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">No donations recorded yet.</p>
            </div>
          )}
          <div className="space-y-3">
            {history.map(d => (
              <div key={d.id} className="bg-panel rounded-2xl border border-white/10 p-5 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Droplets size={18} className="text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BloodTypeTag type={d.blood_type} />
                      <span className="text-sm font-semibold text-zinc-200">{d.units} units</span>
                    </div>
                    <p className="text-xs text-zinc-500">{d.bank_name}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">{new Date(d.donated_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-zinc-100">Hall of Heroes</h2>
            <a href="/leaderboard" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-red-400 font-semibold hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl">
              <Trophy size={13} /> Public view
            </a>
          </div>
          <div className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            {leaderboard.map((d, i) => {
              const rank = getRank(d.total_donations || 0)
              return (
                <div key={i} className={`flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-0 ${i === 0 ? 'bg-yellow-500/10' : ''}`}>
                  <span className="text-xl font-black w-8 text-center">
                    {i < 3 ? RANK_MEDALS[i] : <span className="text-zinc-600 text-sm font-bold">{i + 1}</span>}
                  </span>
                  <div className={`w-10 h-10 rounded-xl ${rank.bg} flex items-center justify-center font-bold text-sm ${rank.color}`}>
                    {d.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate">{d.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold ${rank.color}`}>{rank.name}</span>
                      {d.city && <span className="text-xs text-zinc-500">· {d.city}</span>}
                    </div>
                  </div>
                  {d.blood_type && <BloodTypeTag type={d.blood_type} />}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-red-400">{d.total_donations || 0}</p>
                    <p className="text-xs text-zinc-500">donations</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── JOURNEY REQUESTS ── */}
      {tab === 'journeys' && (
        <div className="max-w-2xl space-y-8">
          {/* Pending */}
          <div>
            <h2 className="text-lg font-bold text-zinc-100 mb-5">Journey Requests</h2>
            {journeys.filter(j => !j.chat_accepted).length === 0 && (
              <div className="bg-panel rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">No pending journey requests right now.</p>
              </div>
            )}
            <div className="space-y-4">
              {journeys.filter(j => !j.chat_accepted).map(j => (
                <div key={j.id} className="bg-panel rounded-2xl border border-white/10 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <Route size={18} className="text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BloodTypeTag type={j.patient_blood_type} />
                          <span className="text-sm font-semibold text-zinc-200">{j.quantity} unit{j.quantity > 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Patient: {j.patient_name || 'Anonymous'}{j.patient_city ? ` · ${j.patient_city}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-orange-500/15 text-orange-400 font-semibold px-2.5 py-1 rounded-lg">Pending</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => respondJourney(j.id, 'accept')}
                      className="bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
                      Accept +25 pts
                    </button>
                    <button onClick={() => respondJourney(j.id, 'decline')}
                      className="bg-white/10 text-zinc-400 py-3 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted — chat */}
          {journeys.filter(j => j.chat_accepted).length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-5">Connected Patients</h2>
              <div className="space-y-4">
                {journeys.filter(j => j.chat_accepted).map(j => (
                  <div key={j.id} className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                          <Heart size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{j.patient_name || 'Anonymous'}</p>
                          <p className="text-xs text-zinc-500">
                            {j.patient_blood_type} · {j.quantity} unit{j.quantity > 1 ? 's' : ''}{j.patient_disease ? ` · ${j.patient_disease.replace('_', ' ')}` : ''}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => chatJourney?.id === j.id ? setChatJourney(null) : openChat(j)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          chatJourney?.id === j.id ? 'bg-white/10 text-zinc-400' : 'bg-red-600 text-white hover:bg-red-700'
                        }`}>
                        <MessageCircle size={15} />
                        {chatJourney?.id === j.id ? 'Close' : 'Chat'}
                      </button>
                    </div>

                    {chatJourney?.id === j.id && (
                      <div className="border-t border-white/10">
                        <div className="h-64 overflow-y-auto p-4 space-y-2 bg-ink">
                          {chatMsgs.length === 0 && (
                            <p className="text-xs text-zinc-500 text-center mt-8">No messages yet. Say hello!</p>
                          )}
                          {chatMsgs.map(m => (
                            <div key={m.id} className={`flex ${m.sender_id === profile?.user_id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                                m.sender_id === profile?.user_id
                                  ? 'bg-red-600 text-white rounded-br-sm'
                                  : 'bg-panel border border-white/10 text-zinc-300 rounded-bl-sm'
                              }`}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                          <div ref={chatBottomRef} />
                        </div>
                        <div className="p-3 bg-panel flex gap-2">
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendChat()}
                            placeholder="Type a message..."
                            className="flex-1 text-sm bg-ink border border-white/10 rounded-xl px-3.5 py-2.5 outline-none focus:border-red-400 focus:bg-white/10 transition-colors" />
                          <button onClick={sendChat} disabled={!chatInput.trim()}
                            className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-700 disabled:opacity-40 transition-colors">
                            <Send size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
