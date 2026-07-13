import { useNavigate } from 'react-router-dom'

export default function Navbar({ role }) {
  const nav = useNavigate()
  const logout = () => { localStorage.clear(); nav('/') }
  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <span className="text-red-600 font-bold text-xl">LifeForge</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="capitalize bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">{role}</span>
        <button onClick={logout} className="text-gray-500 hover:text-red-600 transition-colors">Logout</button>
      </div>
    </nav>
  )
}
