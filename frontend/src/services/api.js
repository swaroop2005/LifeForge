const BASE = '/api'

const authHeader = () => {
  const token = localStorage.getItem('vt_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const get = (path) =>
  fetch(`${BASE}${path}`, { headers: { ...authHeader() } }).then(r => r.json())

const publicGet = (path) =>
  fetch(`${BASE}${path}`).then(r => r.json())

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body)
  }).then(r => r.json())

export const api = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),

  getPatientProfile: () => get('/patient/profile'),
  updatePatientProfile: (data) => post('/patient/profile', data),
  requestBlood: (data) => post('/patient/request-blood', data),
  getPatientRequests: () => get('/patient/requests'),
  getPatientJourneys: () => get('/patient/journeys'),
  getJourney: (id) => get(`/patient/journey/${id}`),

  getDonorProfile: () => get('/donor/profile'),
  getDonorHistory: () => get('/donor/history'),
  getDonorImpact: () => get('/donor/impact'),
  recordDonation: (data) => post('/donor/donate', data),
  getLeaderboard: () => get('/donor/leaderboard'),
  getPublicLeaderboard: () => publicGet('/donor/leaderboard'),
  acceptJourney: (id) => post(`/donor/journey/${id}/accept`, {}),
  declineJourney: (id) => post(`/donor/journey/${id}/decline`, {}),

  requestBloodHospital: (data) => post('/hospital/request-blood', data),
  getHospitalRequests: () => get('/hospital/requests'),
  getNearbyBanks: () => get('/hospital/nearby-banks'),
  traceBlood: (data) => post('/hospital/trace-blood', data),

  getAdminDashboard: () => get('/admin/dashboard'),
  getHeatmap: () => get('/admin/heatmap'),
  getPredictions: () => get('/admin/predictions'),
  getAdminUsers: () => get('/admin/users'),
  runPredictions: () => post('/predictions/run', {}),
  runGreenRAnalysis: () => post('/predictions/greenr-analyze', {}),
  getGreenRLatest: () => get('/predictions/greenr-latest'),

  getBloodBanks: () => get('/blood-banks'),
  searchBanks: (q, state) => get(`/blood-banks/search?q=${encodeURIComponent(q || '')}${state ? `&state=${encodeURIComponent(state)}` : ''}`),
  getBankStock: (id) => get(`/blood-banks/${id}/stock`),
  nationalSearch: (params) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)))
    return publicGet(`/blood-banks/national-search?${q}`)
  },

  getPosts: () => publicGet('/community/posts'),
  createPost: (data) => post('/community/posts', data),
  likePost: (id) => post(`/community/posts/${id}/like`, {}),

  getMessages: (jid) => get(`/chat/messages/${jid}`),
  sendMessage: (jid, content) => post(`/chat/messages/${jid}`, { content }),

  chatbot: (text, language, history = []) => post('/chatbot/message', { text, language, history }),
}
