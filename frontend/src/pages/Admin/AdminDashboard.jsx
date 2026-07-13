import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Users, Droplets, Syringe, Route, Map } from 'lucide-react'
import Layout from '../../components/Layout'
import BloodTypeTag from '../../components/BloodTypeTag'
import { api } from '../../services/api'

function riskColor(risk) {
  if (risk > 0.7) return '#ef4444'
  if (risk > 0.4) return '#f97316'
  return '#22c55e'
}

function KPICard({ label, val, Icon, iconCls, sub }) {
  return (
    <div className="bg-panel rounded-2xl border border-white/10 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-black text-zinc-100">{val ?? '—'}</p>
      <p className="text-sm text-zinc-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [heatmap, setHeatmap] = useState([])
  const [requests, setRequests] = useState([])
  const [greenrAnalysis, setGreenrAnalysis] = useState(null)
  const [greenrLoading, setGreenrLoading] = useState(false)
  const [greenrMsg, setGreenrMsg] = useState('')

  useEffect(() => {
    api.getAdminDashboard().then(setDashboard)
    api.getHeatmap().then(h => setHeatmap(Array.isArray(h) ? h : []))
    api.getAdminRequests().then(r => setRequests(Array.isArray(r) ? r : []))
    api.getGreenRLatest().then(d => { if (d && d.summary) setGreenrAnalysis(d) })
  }, [])

  const runGreenR = async () => {
    setGreenrLoading(true)
    setGreenrMsg('AI reasoning... this may take 10-20s')
    try {
      const res = await api.runGreenRAnalysis()
      if (res.summary) {
        setGreenrAnalysis(res)
        setGreenrMsg('')
      } else {
        setGreenrMsg(res.detail || 'Analysis failed.')
      }
    } catch {
      setGreenrMsg('AI analysis failed.')
    }
    setGreenrLoading(false)
  }

  return (
    <Layout role="admin" activeTab={tab} setTab={setTab}>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total Users" val={dashboard.total_users} Icon={Users} iconCls="bg-purple-500/10 text-purple-400" />
            <KPICard label="Blood Requests" val={dashboard.total_requests} Icon={Droplets} iconCls="bg-red-500/10 text-red-500" />
            <KPICard label="Donations" val={dashboard.total_donations} Icon={Syringe} iconCls="bg-orange-500/10 text-orange-500" />
            <KPICard label="Active Journeys" val={dashboard.active_journeys} Icon={Route} iconCls="bg-blue-500/10 text-blue-500" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Users by role */}
            <div className="bg-panel rounded-2xl border border-white/10 p-6 shadow-sm">
              <h3 className="font-bold text-zinc-100 mb-4">Users by Role</h3>
              <div className="space-y-3">
                {dashboard.users_by_role && Object.entries(dashboard.users_by_role).map(([role, count]) => {
                  const total = Object.values(dashboard.users_by_role).reduce((a, b) => a + b, 0)
                  const pct = total ? Math.round((count / total) * 100) : 0
                  const colors = { patient: 'bg-rose-500', donor: 'bg-red-500', hospital: 'bg-blue-500', admin: 'bg-purple-500' }
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-zinc-300 font-medium">{role}</span>
                        <span className="text-zinc-100 font-bold">{count}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[role] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="bg-panel rounded-2xl border border-white/10 p-6 shadow-sm">
              <h3 className="font-bold text-zinc-100 mb-4">Stock Alerts</h3>
              {(!dashboard.low_stock_alerts || dashboard.low_stock_alerts.length === 0) ? (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                  <span className="text-xl">✅</span>
                  <p className="text-sm text-green-400 font-medium">All blood banks well stocked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboard.low_stock_alerts.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BloodTypeTag type={a.blood_type} />
                        <p className="text-xs text-zinc-400">{a.bank_name}</p>
                      </div>
                      <span className="text-xs font-bold text-red-400 bg-red-500/15 px-2 py-1 rounded-lg">{a.units} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEATMAP ── */}
      {tab === 'map' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Blood Bank Shortage Heatmap</h2>
              <p className="text-xs text-zinc-500 mt-1">{heatmap.length} states · Powered by LifeForge AI</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {[['bg-green-500', 'Low Risk'], ['bg-orange-400', 'Medium'], ['bg-red-500', 'Critical']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${c}`} />
                  <span className="text-zinc-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-panel rounded-2xl border border-white/10 shadow-sm overflow-hidden" style={{ height: '540px' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {heatmap.filter(b => b.lat && b.lng).map(b => (
                <CircleMarker key={b.bank_id || b.id}
                  center={[b.lat, b.lng]}
                  radius={Math.max(12, (b.shortage_risk || 0) * 28)}
                  fillColor={riskColor(b.shortage_risk || 0)}
                  color="#1b1b22"
                  weight={2}
                  fillOpacity={0.85}>
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold text-zinc-100">{b.name}</p>
                      {b.bank_count && <p className="text-zinc-400 text-xs mb-1">{b.bank_count} hospitals</p>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-zinc-400">Shortage Risk</span>
                        <strong className="text-sm" style={{ color: riskColor(b.shortage_risk || 0) }}>
                          {((b.shortage_risk || 0) * 100).toFixed(0)}%
                        </strong>
                      </div>
                      {b.total_units > 0 && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-zinc-400">Total Units</span>
                          <span className="text-xs font-semibold text-zinc-300">{b.total_units}</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ── PREDICTIONS ── */}
      {tab === 'predictions' && (
        <div className="space-y-8">

          {/* AI Shortage Analysis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-zinc-100">AI Shortage Analysis</h2>
                  <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg">Gemini 2.5 Flash</span>
                </div>
                <p className="text-xs text-zinc-500">Reasoning model analyses live stock + disease burden + seasonal patterns</p>
              </div>
              <div className="flex items-center gap-3">
                {greenrMsg && <p className="text-xs text-emerald-400 font-medium max-w-[200px] text-right">{greenrMsg}</p>}
                <button onClick={runGreenR} disabled={greenrLoading}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {greenrLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Reasoning...</>
                  ) : '🧠 Run AI Analysis'}
                </button>
              </div>
            </div>

            {!greenrAnalysis && !greenrLoading && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">🧠</p>
                <p className="text-sm font-semibold text-emerald-300 mb-1">AI analysis not yet run</p>
                <p className="text-xs text-emerald-400">Click "Run AI Analysis" to get AI-powered shortage predictions using live blood bank data + India disease statistics</p>
              </div>
            )}

            {greenrAnalysis && (
              <div className="space-y-4">
                {/* Summary banner */}
                <div className={`rounded-2xl p-5 border-l-4 ${
                  greenrAnalysis.overall_risk === 'critical' ? 'bg-red-500/10 border-red-500' :
                  greenrAnalysis.overall_risk === 'high' ? 'bg-orange-500/10 border-orange-500' :
                  greenrAnalysis.overall_risk === 'medium' ? 'bg-yellow-500/10 border-yellow-500' :
                  'bg-green-500/10 border-green-500'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                          greenrAnalysis.overall_risk === 'critical' ? 'bg-red-600 text-white' :
                          greenrAnalysis.overall_risk === 'high' ? 'bg-orange-500 text-white' :
                          greenrAnalysis.overall_risk === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-600 text-white'
                        }`}>{greenrAnalysis.overall_risk} risk</span>
                        <span className="text-xs text-zinc-500">Generated {greenrAnalysis.generated_at ? new Date(greenrAnalysis.generated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{greenrAnalysis.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Critical Alerts */}
                  <div className="bg-panel rounded-2xl border border-white/10 p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-100 mb-3 flex items-center gap-2">
                      <span>🚨</span> Critical Alerts
                      <span className="text-xs font-normal text-zinc-500 ml-auto">{greenrAnalysis.critical_alerts?.length || 0} issues</span>
                    </h3>
                    {(!greenrAnalysis.critical_alerts || greenrAnalysis.critical_alerts.length === 0) ? (
                      <p className="text-sm text-green-400 font-medium">✅ No critical alerts</p>
                    ) : (
                      <div className="space-y-3">
                        {greenrAnalysis.critical_alerts.map((alert, i) => (
                          <div key={i} className={`rounded-xl p-3 border ${
                            alert.risk_level === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                            alert.risk_level === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                            'bg-yellow-500/10 border-yellow-500/30'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <BloodTypeTag type={alert.blood_type} />
                              <span className="text-xs font-bold text-zinc-300">{alert.region}</span>
                              {alert.current_units !== undefined && (
                                <span className="text-xs text-zinc-500 ml-auto">{alert.current_units} units left</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mb-1">{alert.reason}</p>
                            <p className="text-xs font-semibold text-emerald-400">→ {alert.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Immediate Actions */}
                  <div className="bg-panel rounded-2xl border border-white/10 p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-100 mb-3 flex items-center gap-2">
                      <span>⚡</span> Immediate Actions
                    </h3>
                    {(!greenrAnalysis.immediate_actions || greenrAnalysis.immediate_actions.length === 0) ? (
                      <p className="text-sm text-zinc-500">No actions required</p>
                    ) : (
                      <ol className="space-y-2">
                        {greenrAnalysis.immediate_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                            <span className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                            {action}
                          </li>
                        ))}
                      </ol>
                    )}

                    {greenrAnalysis.demand_forecast && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">30-Day Forecast</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">{greenrAnalysis.demand_forecast}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regional Analysis */}
                {greenrAnalysis.regional_analysis && greenrAnalysis.regional_analysis.length > 0 && (
                  <div className="bg-panel rounded-2xl border border-white/10 p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2"><Map size={16} className="text-zinc-400" /> Regional Analysis</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {greenrAnalysis.regional_analysis.map((region, i) => (
                        <div key={i} className="border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm text-zinc-100">{region.region}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                              region.overall_risk === 'critical' ? 'bg-red-500/15 text-red-400' :
                              region.overall_risk === 'high' ? 'bg-orange-500/15 text-orange-400' :
                              region.overall_risk === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                              'bg-green-500/15 text-green-400'
                            }`}>{region.overall_risk}</span>
                          </div>
                          {region.key_issues?.map((issue, j) => (
                            <p key={j} className="text-xs text-zinc-400 flex items-start gap-1 mb-1">
                              <span className="text-red-400 shrink-0">•</span>{issue}
                            </p>
                          ))}
                          {region.strengths?.map((s, j) => (
                            <p key={j} className="text-xs text-green-400 flex items-start gap-1 mb-1">
                              <span className="shrink-0">✓</span>{s}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── BLOOD REQUESTS ── */}
      {tab === 'requests' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-zinc-100">Blood Requests</h2>
            <p className="text-xs text-zinc-500 mt-1">{requests.length} requests across the platform</p>
          </div>
          {requests.length === 0 ? (
            <div className="bg-panel rounded-2xl border border-white/10 p-10 text-center shadow-sm">
              <p className="text-sm text-zinc-500">No blood requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="bg-panel rounded-2xl border border-white/10 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <BloodTypeTag type={r.blood_type} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{r.requester_name}</p>
                      <p className="text-xs text-zinc-500 capitalize">
                        {r.requester_type}{r.hospital_name ? ` · ${r.hospital_name}` : ''} · {r.quantity} unit{r.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${
                      r.urgency === 'critical' ? 'bg-red-500/15 text-red-400' :
                      r.urgency === 'urgent' ? 'bg-orange-500/15 text-orange-400' :
                      'bg-white/10 text-zinc-400'
                    }`}>{r.urgency}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${
                      r.status === 'fulfilled' ? 'bg-green-500/15 text-green-400' :
                      r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-white/10 text-zinc-400'
                    }`}>{r.status}</span>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
