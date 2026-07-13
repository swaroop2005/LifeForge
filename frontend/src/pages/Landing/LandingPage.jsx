import { useNavigate } from 'react-router-dom'
import {
  Heart, Droplets, Building2, ShieldCheck, Route, Bot,
  BarChart3, Trophy, Hospital, MessageCircle, Lock,
  Database, Zap, Wrench, ChevronRight, ArrowRight, Sparkles, Brain
} from 'lucide-react'
import ChatbotWidget from '../../components/ChatbotWidget'

const PORTAL_CARDS = [
  { role: 'patient', icon: Heart, label: 'Patient', desc: 'Track disorders, request blood, chat with donors', href: '/login/patient', color: 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/15', iconBg: 'bg-red-500/15 text-red-400' },
  { role: 'donor', icon: Droplets, label: 'Donor', desc: 'Record donations, earn badges, see your impact', href: '/login/donor', color: 'border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/10', iconBg: 'bg-orange-500/15 text-orange-400' },
  { role: 'hospital', icon: Building2, label: 'Hospital', desc: 'Request blood, trace donations, view nearby banks', href: '/login/hospital', color: 'border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10', iconBg: 'bg-blue-500/15 text-blue-400' },
  { role: 'admin', icon: ShieldCheck, label: 'Admin', desc: 'Monitor the network, view heatmaps and predictions', href: '/admin-login', color: 'border-white/10 hover:border-white/25 hover:bg-white/5', iconBg: 'bg-white/10 text-zinc-400' },
]

const STATS = [
  { val: '4,000+', label: 'Blood Banks' },
  { val: '36', label: 'States & UTs' },
  { val: '4', label: 'Role Portals' },
  { val: '24/7', label: 'AI Assistant' },
]

const FEATURES = [
  { icon: Route, title: 'Blood Journey Tracking', desc: 'Trace every unit from donor to patient. Real-time status, full transparency.' },
  { icon: Bot, title: 'AI Health Companion', desc: 'RAG-grounded assistant with live data tools — disease diet, donor eligibility, compatibility, and real blood availability.' },
  { icon: BarChart3, title: 'Shortage Prediction', desc: 'AI reasoning over live stock, disease epidemiology and seasonal patterns forecasts shortages before they happen.' },
  { icon: Trophy, title: 'Donor Gamification', desc: 'Points, badges and leaderboards motivate repeat donors. First Drop → Lifesaver → Hero.' },
  { icon: Hospital, title: 'Hospital Portal', desc: 'Request blood, view nearby banks with live stock, and trace donations directly to patients.' },
  { icon: MessageCircle, title: 'Patient–Donor Chat', desc: 'After a journey is accepted, patients can send one message and open a private chat with their donor.' },
]

const DISEASES_LIST = [
  { name: 'Thalassemia', color: 'bg-red-500/15 text-red-400' },
  { name: 'Sickle Cell', color: 'bg-orange-500/15 text-orange-400' },
  { name: 'Hemophilia A & B', color: 'bg-purple-500/15 text-purple-400' },
  { name: 'Iron Deficiency Anemia', color: 'bg-yellow-500/15 text-yellow-400' },
  { name: 'Aplastic Anemia', color: 'bg-blue-500/15 text-blue-400' },
  { name: 'Von Willebrand', color: 'bg-green-500/15 text-green-400' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register your role', desc: 'Patient, Donor, Hospital or Admin — each gets a tailored portal with the right tools.' },
  { step: '02', title: 'Connect with the network', desc: 'Patients request blood. Donors record donations. Hospitals trace units. Admin monitors everything.' },
  { step: '03', title: 'AI handles the complexity', desc: 'The assistant answers health questions from verified knowledge, checks live blood availability, and forecasts shortages.' },
  { step: '04', title: 'Save lives, earn recognition', desc: 'Every donation is tracked, gamified, and traced to the patient it helped. Impact is visible and real.' },
]

const AI_POINTS = [
  { icon: Database, text: 'Grounded in real eRaktKosh data — 4,000+ blood banks, 47,000+ live stock records' },
  { icon: Brain, text: 'RAG over verified medical knowledge (NIH ODS + curated disease guidance)' },
  { icon: Wrench, text: '5 live tools: eligibility, compatibility, shortage alerts, donor impact, bank search' },
  { icon: Sparkles, text: 'Disease-aware answers — thalassemia patients never get iron advice' },
  { icon: Zap, text: 'Reasoning engine forecasts shortages from stock + epidemiology' },
  { icon: Lock, text: 'Role-based access — patients, donors and hospitals see only what they should' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="min-h-screen bg-ink font-sans">

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/85 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="w-8 h-8 bg-gradient-to-br from-crimson to-coral rounded-lg glow-sm flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </span>
            <span className="font-bold text-zinc-100 text-lg">LifeForge</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-red-400 transition-colors">Features</a>
            <a href="#how" className="hover:text-red-400 transition-colors">How It Works</a>
            <a href="#diseases" className="hover:text-red-400 transition-colors">Diseases</a>
            <a href="/community" className="hover:text-red-400 transition-colors font-medium">Community</a>
            <a href="/leaderboard" className="hover:text-red-400 transition-colors font-medium">Leaderboard</a>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-full">
              <Sparkles size={11} /> AI-Powered · Real Data
            </span>
            <a href="#auth" className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16 min-h-screen flex items-center bg-ink grid-bg relative overflow-hidden">
        {/* decorative orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-crimson/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-crimson/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-coral/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center w-full relative">

          {/* Left — Copy */}
          <div className="text-zinc-100">
            <div className="inline-flex items-center gap-2 glass text-zinc-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-crimson rounded-full animate-pulse"></span>
              Universal Blood Disorder Support Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Forging the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson to-coral">lifeline</span> between<br />
              donors and<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson to-coral">patients.</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-md">
              LifeForge connects patients, donors, and hospitals across thalassemia, sickle cell, hemophilia, anemia and more — every unit traced, every question answered by AI.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="glass rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-zinc-100">{s.val}</p>
                  <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-zinc-500 text-xs mb-3">Designed for NGOs like</p>
              <div className="flex flex-wrap gap-2">
                {['Blood Warriors', 'Thalassemia Society', 'Hemophilia Federation', 'SCDAA'].map(n => (
                  <span key={n} className="glass text-zinc-300 text-xs px-3 py-1.5 rounded-lg">{n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Portal Selection */}
          <div id="auth" className="glass rounded-3xl p-8 glow">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Choose your portal</h2>
            <p className="text-zinc-500 text-sm mb-6">Each role has a dedicated sign-in and registration page.</p>

            <div className="space-y-3">
              {PORTAL_CARDS.map(p => {
                const Icon = p.icon
                return (
                  <button key={p.role} onClick={() => nav(p.href)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${p.color}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.iconBg}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-100 text-sm">{p.label} Portal</p>
                      <p className="text-zinc-400 text-xs mt-0.5">{p.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </button>
                )
              })}
            </div>

            <p className="text-center text-xs text-zinc-500 mt-6">
              Real data · AI-assisted · Privacy first
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-ink">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl font-bold text-zinc-100 mt-3 mb-4">Everything in one place</h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">From donation to delivery — every step tracked, AI-assisted, and gamified.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-panel rounded-2xl p-7 border border-white/10 hover:border-red-500/30 hover:shadow-lg transition-all group">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-500/15 transition-colors">
                    <Icon size={22} className="text-red-400" />
                  </div>
                  <h3 className="font-bold text-zinc-100 text-lg mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 bg-panel">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">Process</span>
            <h2 className="text-4xl font-bold text-zinc-100 mt-3 mb-4">How LifeForge works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-red-500/15 z-0" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg mb-5 shadow-lg shadow-red-900/40">
                    {h.step}
                  </div>
                  <h3 className="font-bold text-zinc-100 text-lg mb-2">{h.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISEASES ── */}
      <section id="diseases" className="py-24 bg-ink">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">Coverage</span>
              <h2 className="text-4xl font-bold text-zinc-100 mt-3 mb-4">Built for every blood disorder</h2>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                LifeForge is disease-agnostic. Any NGO, hospital, or patient network working on blood disorders can use the platform.
              </p>
              <div className="flex flex-wrap gap-3">
                {DISEASES_LIST.map(d => (
                  <span key={d.name} className={`px-4 py-2 rounded-xl text-sm font-semibold ${d.color}`}>
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-10 glow relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-crimson/20 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-2xl font-bold mb-6 text-zinc-100 relative">The LifeForge AI Advantage</h3>
              <div className="space-y-5 relative">
                {AI_POINTS.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-crimson/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={14} className="text-coral" />
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-ink grid-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-crimson/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-4xl font-bold text-zinc-100 mb-4">Ready to save lives?</h2>
          <p className="text-zinc-400 text-lg mb-8">Join donors, hospitals, and patients already on the network.</p>
          <a href="#auth"
            className="inline-flex items-center gap-2 bg-crimson text-white font-bold px-10 py-4 rounded-2xl text-lg hover:bg-red-500 transition-colors glow">
            Get Started — It's Free <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-panel-2 text-zinc-500 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-br from-crimson to-coral rounded-lg glow-sm flex items-center justify-center">
                <Droplets size={16} className="text-white" />
              </span>
              <div>
                <p className="text-white font-bold">LifeForge</p>
                <p className="text-xs">Universal Blood Disorder Support Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Built for</span>
              <span className="text-red-400 font-semibold">ImpactForge 2026</span>
            </div>
            <p className="text-xs">© 2026 LifeForge · Built for impact</p>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  )
}
