import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Droplets, Building2, Eye, EyeOff } from 'lucide-react'
import { api } from '../../services/api'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DISEASES = ['thalassemia', 'sickle_cell', 'hemophilia', 'anemia', 'aplastic_anemia', 'other']

const ROLE_META = {
  patient: { label: 'Patient', Icon: Heart, desc: 'Track your blood disorder journey', iconCls: 'bg-red-500/15 text-red-400' },
  donor:   { label: 'Donor',   Icon: Droplets, desc: 'Record donations and see your impact', iconCls: 'bg-orange-500/15 text-orange-400' },
  hospital:{ label: 'Hospital',Icon: Building2, desc: 'Request blood and trace donations', iconCls: 'bg-blue-500/15 text-blue-600' },
}

export default function RoleAuth({ role }) {
  const nav = useNavigate()
  const meta = ROLE_META[role]
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '', password: '', name: '', blood_type: 'O+',
    disease: 'thalassemia', city: '', state: '',
    is_long_term: false, contact: '', reg_number: '',
    next_transfusion_date: '', last_donation_date: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('vt_token')
    const existingRole = localStorage.getItem('vt_role')
    if (token && existingRole) nav(`/${existingRole}`, { replace: true })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await api.login({ email: form.email, password: form.password })
        if (res.access_token) {
          if (res.role !== role) {
            setError(`This account is a ${res.role}. Use the ${res.role} portal.`)
          } else {
            localStorage.setItem('vt_token', res.access_token)
            localStorage.setItem('vt_role', res.role)
            nav(`/${res.role}`, { replace: true })
          }
        } else {
          setError(res.detail || 'Invalid credentials')
        }
      } else {
        const payload = {
          email: form.email, password: form.password, role,
          name: form.name, city: form.city, state: form.state,
        }
        if (role === 'patient') {
          payload.blood_type = form.blood_type
          payload.disease = form.disease
          if (form.next_transfusion_date) payload.next_transfusion_date = new Date(form.next_transfusion_date).toISOString()
        }
        if (role === 'donor') {
          payload.blood_type = form.blood_type
          payload.is_long_term = form.is_long_term
          if (form.last_donation_date) payload.last_donation_date = new Date(form.last_donation_date).toISOString()
        }
        if (role === 'hospital'){ payload.contact = form.contact; payload.reg_number = form.reg_number }
        const res = await api.register(payload)
        if (res.access_token) {
          localStorage.setItem('vt_token', res.access_token)
          localStorage.setItem('vt_role', res.role)
          nav(`/${res.role}`)
        } else {
          setError(res.detail || 'Registration failed')
        }
      }
    } catch { setError('Network error. Is the server running?') }
    setLoading(false)
  }

  const inputCls = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-red-400 focus:bg-white/10 transition-colors placeholder-gray-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-panel rounded-3xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <meta.Icon size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">{meta.label} Portal</h1>
            <p className="text-zinc-500 text-sm mt-1">{meta.desc}</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl capitalize transition-all
                  ${mode === m ? 'bg-panel text-red-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="text-sm mb-5 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="Full name" className={inputCls} />
            )}

            <input value={form.email} onChange={e => set('email', e.target.value)} required
              type="email" placeholder="Email address" className={inputCls} />
            <div className="relative">
              <input value={form.password} onChange={e => set('password', e.target.value)} required
                type={showPw ? 'text' : 'password'} placeholder="Password" className={inputCls + ' pr-11'} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'register' && (
              <>
                {/* blood type + disease: patient only */}
                {role === 'patient' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)} className={inputCls}>
                        {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                      </select>
                      <select value={form.disease} onChange={e => set('disease', e.target.value)} className={inputCls}>
                        {DISEASES.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1">Next Transfusion Date</label>
                      <input type="date" value={form.next_transfusion_date}
                        onChange={e => set('next_transfusion_date', e.target.value)}
                        className={inputCls} />
                      <p className="text-xs text-zinc-500 mt-1">Leave blank if unknown — you can update later</p>
                    </div>
                  </>
                )}

                {/* blood type: donor only */}
                {role === 'donor' && (
                  <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)} className={inputCls}>
                    {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                  </select>
                )}

                {/* city + state: all roles */}
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" className={inputCls} />
                  <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="State" className={inputCls} />
                </div>

                {role === 'donor' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1">Last Donated On (if ever)</label>
                      <input type="date" value={form.last_donation_date}
                        onChange={e => set('last_donation_date', e.target.value)}
                        className={inputCls} />
                      <p className="text-xs text-zinc-500 mt-1">We'll calculate when you're eligible to donate again</p>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer bg-ink px-4 py-3 rounded-xl">
                      <input type="checkbox" checked={form.is_long_term} onChange={e => set('is_long_term', e.target.checked)}
                        className="accent-red-600 w-4 h-4" />
                      Long-term donor commitment
                    </label>
                  </>
                )}

                {role === 'hospital' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Contact no." className={inputCls} />
                    <input value={form.reg_number} onChange={e => set('reg_number', e.target.value)} placeholder="Reg. number" className={inputCls} />
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Please wait...' : mode === 'login' ? `Sign In as ${meta.label}` : `Create ${meta.label} Account`}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6">
            <a href="/" className="hover:text-red-500 transition-colors">← Back to LifeForge</a>
          </p>
        </div>
      </div>
    </div>
  )
}
