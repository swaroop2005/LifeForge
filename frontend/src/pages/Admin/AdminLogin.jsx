import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../../services/api'

export default function AdminLogin() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('vt_token')
    const role = localStorage.getItem('vt_role')
    if (token && role === 'admin') nav('/admin', { replace: true })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login({ email: form.email, password: form.password })
      if (res.access_token && res.role === 'admin') {
        localStorage.setItem('vt_token', res.access_token)
        localStorage.setItem('vt_role', res.role)
        nav('/admin', { replace: true })
      } else if (res.access_token) {
        setError('Access denied. Admin credentials required.')
      } else {
        setError(res.detail || 'Invalid credentials')
      }
    } catch { setError('Network error. Is the server running?') }
    setLoading(false)
  }

  const inputCls = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-red-400 focus:bg-white/10 transition-colors placeholder-gray-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-panel rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">L</div>
            <h1 className="text-2xl font-bold text-zinc-100">Admin Portal</h1>
            <p className="text-zinc-500 text-sm mt-1">LifeForge — Restricted Access</p>
          </div>

          {error && (
            <div className="text-sm mb-5 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <input value={form.email} onChange={e => set('email', e.target.value)} required
              type="email" placeholder="Admin email" className={inputCls} />
            <div className="relative">
              <input value={form.password} onChange={e => set('password', e.target.value)} required
                type={showPw ? 'text' : 'password'} placeholder="Password" className={inputCls + ' pr-11'} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
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
