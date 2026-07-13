import { useNavigate } from 'react-router-dom'
import {
  Droplets, Plus, Route, MessageCircle, Star, ClipboardList,
  Trophy, Bell, BarChart3, Map, Brain, Building2,
  Leaf, LogOut, Shield
} from 'lucide-react'
import ChatbotWidget from './ChatbotWidget'

const COMMUNITY_LINK = { path: '__community__', label: 'Community', icon: MessageCircle, external: '/community' }

const NAV = {
  patient: [
    { path: 'requests', label: 'My Requests', icon: ClipboardList },
    { path: 'new-request', label: 'Request Blood', icon: Plus },
    { path: 'journey', label: 'Blood Journey', icon: Route },
    { path: 'blood-banks', label: 'Find Blood', icon: Building2 },
    COMMUNITY_LINK,
  ],
  donor: [
    { path: 'profile', label: 'My Impact', icon: Star },
    { path: 'donate', label: 'Record Donation', icon: Droplets },
    { path: 'history', label: 'History', icon: ClipboardList },
    { path: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: 'journeys', label: 'Journey Requests', icon: Bell },
    COMMUNITY_LINK,
  ],
  hospital: [
    { path: 'requests', label: 'Blood Requests', icon: ClipboardList },
    { path: 'new-request', label: 'Request Blood', icon: Plus },
    { path: 'blood-banks', label: 'Nearby Banks', icon: Building2 },
    { path: 'trace-blood', label: 'Trace Blood', icon: Route },
    COMMUNITY_LINK,
  ],
  admin: [
    { path: 'overview', label: 'Overview', icon: BarChart3 },
    { path: 'requests', label: 'Blood Requests', icon: ClipboardList },
    { path: 'map', label: 'Heatmap', icon: Map },
    { path: 'predictions', label: 'Predictions', icon: Brain },
    COMMUNITY_LINK,
  ],
}

const ROLE_COLORS = {
  patient: 'bg-rose-500',
  donor: 'bg-red-600',
  hospital: 'bg-blue-600',
  admin: 'bg-purple-600',
}

export default function Layout({ role, activeTab, setTab, children, badge }) {
  const nav = useNavigate()
  const name = localStorage.getItem('vt_name') || role

  const logout = () => {
    localStorage.clear()
    nav('/')
  }

  const links = NAV[role] || []

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <button onClick={() => nav('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </span>
            <span className="font-bold text-gray-900">LifeForge</span>
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${ROLE_COLORS[role] || 'bg-red-600'}`}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const Icon = link.icon
            return (
              <button key={link.path}
                onClick={() => link.external ? nav(link.external) : setTab(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                  ${activeTab === link.path && !link.external
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}>
                <Icon size={16} className="shrink-0" />
                <span>{link.label}</span>
                {link.path === 'journeys' && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 mb-3">
            <Leaf size={13} />
            <span className="font-medium">GreenPT AI Active</span>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 px-8 h-16 flex items-center justify-between z-30">
          <div>
            <h1 className="text-base font-bold text-gray-900 capitalize">
              {links.find(l => l.path === activeTab)?.label || activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`capitalize px-3 py-1.5 rounded-lg font-semibold text-white ${ROLE_COLORS[role] || 'bg-red-600'}`}>{role}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>

      <ChatbotWidget />
    </div>
  )
}
