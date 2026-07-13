import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Trophy, Heart, MapPin } from 'lucide-react'
import { api } from '../../services/api'

const RANKS = [
  { min: 0,   max: 0,   name: 'Aspiring Soul',  pill: 'bg-white/10 text-zinc-400' },
  { min: 1,   max: 1,   name: 'First Drop',      pill: 'bg-blue-500/15 text-blue-600' },
  { min: 2,   max: 4,   name: 'Spark of Life',   pill: 'bg-teal-100 text-teal-600' },
  { min: 5,   max: 9,   name: 'Guardian Angel',  pill: 'bg-indigo-100 text-indigo-600' },
  { min: 10,  max: 24,  name: 'Lifesaver',       pill: 'bg-purple-500/15 text-purple-400' },
  { min: 25,  max: 49,  name: 'Hero',            pill: 'bg-yellow-500/15 text-yellow-400' },
  { min: 50,  max: 99,  name: 'Champion',        pill: 'bg-orange-500/15 text-orange-400' },
  { min: 100, max: Infinity, name: 'Legend',     pill: 'bg-red-500/15 text-red-400' },
]

function getRank(n) {
  return RANKS.find(r => n >= r.min && n <= r.max) || RANKS[0]
}

const PODIUM_STYLES = [
  { medal: '🥇', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', badge: 'bg-yellow-400', order: 'order-2', height: 'pt-0' },
  { medal: '🥈', bg: 'bg-ink',   border: 'border-white/10',   badge: 'bg-gray-400',   order: 'order-1', height: 'pt-6' },
  { medal: '🥉', bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-400', order: 'order-3', height: 'pt-10' },
]

export default function LeaderboardPage() {
  const nav = useNavigate()
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPublicLeaderboard()
      .then(d => { setDonors(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const top3 = donors.slice(0, 3)
  const rest  = donors.slice(3)

  return (
    <div className="min-h-screen bg-ink">

      {/* Header */}
      <div className="bg-panel border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => nav('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors text-sm font-medium">
            <Droplets size={16} className="text-red-400" />
            LifeForge
          </button>
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Hall of Heroes</span>
          <a href="/login/donor"
            className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Join
          </a>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-red-600 to-rose-500 text-white text-center py-12 px-6">
        <Trophy size={36} className="mx-auto mb-3 text-yellow-300" />
        <h1 className="text-3xl font-black mb-2">Hall of Heroes</h1>
        <p className="text-red-100 text-sm max-w-sm mx-auto">
          Every donation is a life saved. These donors show up so others can live.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {loading && (
          <div className="text-center text-zinc-500 py-20">Loading...</div>
        )}

        {!loading && donors.length === 0 && (
          <div className="text-center py-20">
            <Heart size={40} className="mx-auto mb-3 text-red-300" />
            <p className="text-zinc-400">No donors yet. Be the first hero.</p>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[top3[1], top3[0], top3[2]].map((d, idx) => {
              if (!d) return <div key={idx} className="w-32" />
              const realPos = d === top3[0] ? 0 : d === top3[1] ? 1 : 2
              const s = PODIUM_STYLES[realPos]
              const rank = getRank(d.total_donations || 0)
              return (
                <div key={d.name} className={`${s.order} flex flex-col items-center ${s.height}`}>
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-2xl bg-panel border-2 border-white/10 shadow-sm flex items-center justify-center text-2xl font-black text-zinc-300">
                      {d.name?.charAt(0)}
                    </div>
                    <span className="absolute -top-2 -right-2 text-lg">{s.medal}</span>
                  </div>
                  <p className="font-bold text-zinc-100 text-sm text-center leading-tight max-w-[100px] truncate">{d.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${rank.pill}`}>{rank.name}</span>
                  <div className={`mt-3 w-28 ${s.bg} border ${s.border} rounded-2xl py-3 text-center`}>
                    <p className="text-2xl font-black text-zinc-100">{d.total_donations || 0}</p>
                    <p className="text-xs text-zinc-400">donations</p>
                    <p className="text-xs font-bold text-red-400 mt-0.5">{d.points} pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full ranked list */}
        {donors.length > 0 && (
          <div className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 px-5 py-3 bg-ink border-b border-white/10 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Donor</div>
              <div className="col-span-2 text-center">Blood</div>
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-2 text-right">Donations</div>
            </div>

            {donors.map((d, i) => {
              const rank = getRank(d.total_donations || 0)
              const medals = ['🥇','🥈','🥉']
              return (
                <div key={i}
                  className={`grid grid-cols-12 items-center px-5 py-3.5 border-b border-white/10 last:border-0 transition-colors hover:bg-white/5
                    ${i === 0 ? 'bg-yellow-500/10/60' : i === 1 ? 'bg-ink/60' : i === 2 ? 'bg-orange-500/10/60' : ''}`}>
                  {/* Rank # */}
                  <div className="col-span-1 text-sm font-bold text-zinc-500">
                    {i < 3 ? medals[i] : <span className="text-zinc-600">{i + 1}</span>}
                  </div>
                  {/* Name + location */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                      {d.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-100 text-sm truncate">{d.name}</p>
                      {d.city && (
                        <p className="text-xs text-zinc-500 flex items-center gap-0.5 mt-0.5">
                          <MapPin size={10} />{d.city}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Blood type */}
                  <div className="col-span-2 text-center">
                    {d.blood_type && (
                      <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20">
                        {d.blood_type}
                      </span>
                    )}
                  </div>
                  {/* Rank badge */}
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rank.pill}`}>
                      {rank.name}
                    </span>
                  </div>
                  {/* Donations */}
                  <div className="col-span-2 text-right">
                    <p className="text-lg font-black text-zinc-100">{d.total_donations || 0}</p>
                    <p className="text-xs text-zinc-500">{d.points} pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-zinc-500 text-xs mt-6">
          Every donation counts. <a href="/login/donor" className="text-red-500 font-semibold hover:underline">Register as a donor →</a>
        </p>
      </div>
    </div>
  )
}
