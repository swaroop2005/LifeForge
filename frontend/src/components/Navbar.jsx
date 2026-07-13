import { useNavigate } from 'react-router-dom'

export default function Navbar({ role }) {
  const nav = useNavigate()
  const logout = () => { localStorage.clear(); nav('/') }
  return (
    <nav className="bg-panel border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <span className="text-red-400 font-bold text-xl">LifeForge</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="capitalize bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-medium">{role}</span>
        <button onClick={logout} className="text-zinc-400 hover:text-red-400 transition-colors">Logout</button>
      </div>
    </nav>
  )
}
