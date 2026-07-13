import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Eye, PenLine, Tag, Globe, Heart } from 'lucide-react'
import { api } from '../../services/api'
import ChatbotWidget from '../../components/ChatbotWidget'

const ROLE_STYLES = {
  patient:  { cls: 'bg-rose-100 text-rose-700',   label: 'Patient' },
  donor:    { cls: 'bg-red-100 text-red-700',      label: 'Donor' },
  hospital: { cls: 'bg-blue-100 text-blue-700',    label: 'Hospital' },
  admin:    { cls: 'bg-purple-100 text-purple-700', label: 'Admin' },
}

const DISEASE_COLORS = {
  thalassemia:    'bg-red-50 text-red-600 border-red-200',
  sickle_cell:    'bg-orange-50 text-orange-600 border-orange-200',
  hemophilia:     'bg-purple-50 text-purple-600 border-purple-200',
  anemia:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  aplastic_anemia:'bg-blue-50 text-blue-600 border-blue-200',
  donor:          'bg-green-50 text-green-700 border-green-200',
  hospital:       'bg-sky-50 text-sky-600 border-sky-200',
  admin:          'bg-gray-50 text-gray-600 border-gray-200',
}

const BLOOD_COLORS = {
  'O+': 'bg-red-100 text-red-700', 'O-': 'bg-red-200 text-red-800',
  'A+': 'bg-blue-100 text-blue-700', 'A-': 'bg-blue-200 text-blue-800',
  'B+': 'bg-green-100 text-green-700', 'B-': 'bg-green-200 text-green-800',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-200 text-purple-800',
}

export default function CommunityPage() {
  const nav = useNavigate()
  const token = localStorage.getItem('vt_token')
  const userRole = localStorage.getItem('vt_role')
  const userName = localStorage.getItem('vt_name')

  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ title: '', content: '', disease_tag: '' })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getPosts().then(p => { setPosts(Array.isArray(p) ? p : []); setLoading(false) })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setPosting(true)
    const res = await api.createPost({ title: form.title, content: form.content, disease_tag: form.disease_tag || undefined })
    if (res.id) {
      setForm({ title: '', content: '', disease_tag: '' })
      setShowForm(false)
      api.getPosts().then(p => setPosts(Array.isArray(p) ? p : []))
    }
    setPosting(false)
  }

  const like = async (id) => {
    const res = await api.likePost(id)
    if (res?.likes !== undefined) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: res.likes, liked_by_me: true } : p))
    }
  }

  const FILTERS = [
    { key: 'all', label: 'All Posts' },
    { key: 'patient', label: 'Patients' },
    { key: 'donor', label: 'Donors' },
    { key: 'hospital', label: 'Hospitals' },
  ]

  const filtered = filter === 'all' ? posts : posts.filter(p => p.author_type === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => nav('/')} className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">V</span>
            <span className="font-bold text-gray-900">VitaTrace</span>
          </button>
          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3">
                <button onClick={() => nav(`/${userRole}`)}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  ← My Dashboard
                </button>
                <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                  {userName?.charAt(0)}
                </div>
              </div>
            ) : (
              <button onClick={() => nav('/')}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                Sign In to Post
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-3xl font-bold mb-2">Community</h1>
            <p className="text-red-100 text-sm">Stories, tips, and support from patients, donors, and hospitals worldwide.</p>
            <p className="text-red-200 text-xs mt-2">Read freely · Login to post</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Left — posts */}
            <div className="md:col-span-2 space-y-5">
              {/* Write post */}
              {token ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {!showForm ? (
                    <button onClick={() => setShowForm(true)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                        {userName?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-400">Share something with the community...</span>
                    </button>
                  ) : (
                    <form onSubmit={submit} className="p-5">
                      {/* Author preview */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                          {userName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{userName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${ROLE_STYLES[userRole]?.cls || 'bg-gray-100 text-gray-600'}`}>
                              {ROLE_STYLES[userRole]?.label || userRole}
                            </span>
                          </div>
                        </div>
                      </div>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Title" required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 mb-3" />
                      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        placeholder="What's on your mind? Share your experience, ask for help, or encourage others..." required
                        rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-400 resize-none mb-3" />
                      <select value={form.disease_tag} onChange={e => setForm(f => ({ ...f, disease_tag: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 outline-none focus:border-red-400 mb-4">
                        <option value="">No disease tag (optional)</option>
                        <option value="thalassemia">Thalassemia</option>
                        <option value="sickle_cell">Sickle Cell</option>
                        <option value="hemophilia">Hemophilia</option>
                        <option value="anemia">Anemia</option>
                        <option value="aplastic_anemia">Aplastic Anemia</option>
                        <option value="other">Other Blood Disorder</option>
                      </select>
                      <div className="flex justify-between items-center">
                        <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">
                          Cancel
                        </button>
                        <button type="submit" disabled={posting}
                          className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                          {posting ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Sign in to share your story or ask the community.</p>
                  <button onClick={() => nav('/')}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                    Sign In
                  </button>
                </div>
              )}

              {/* Filter chips */}
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all
                      ${filter === f.key ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                      <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">No posts yet in this category. Be the first to share!</p>
                </div>
              )}

              {!loading && filtered.map(p => (
                <article key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                  {/* Author row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 font-bold text-sm">
                        {p.author_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.author_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {/* Role tag */}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${ROLE_STYLES[p.author_type]?.cls || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_STYLES[p.author_type]?.label || p.author_type}
                          </span>
                          {/* Blood type */}
                          {p.author_blood_type && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${BLOOD_COLORS[p.author_blood_type] || 'bg-gray-100 text-gray-600'}`}>
                              {p.author_blood_type}
                            </span>
                          )}
                          {/* Disease tag */}
                          {p.disease_tag && p.disease_tag !== p.author_type && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${DISEASE_COLORS[p.disease_tag] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {p.disease_tag.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 whitespace-nowrap ml-2">
                      {new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{p.content}</p>

                  {/* Like */}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4">
                    <button onClick={() => !p.liked_by_me && like(p.id)}
                      disabled={p.liked_by_me}
                      className={`flex items-center gap-1.5 text-xs transition-colors group ${p.liked_by_me ? 'text-red-500 cursor-default' : 'text-gray-400 hover:text-red-500'}`}>
                      <Heart size={13} className={`transition-transform ${p.liked_by_me ? 'fill-red-500 text-red-500' : 'group-hover:scale-125 group-hover:fill-red-500 group-hover:text-red-500'}`} />
                      <span className="font-semibold">{p.likes || 0}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* About */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3">About Community</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  A safe space for patients, donors, and healthcare workers to share experiences, tips, and support around blood disorders.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    { Icon: Eye, text: 'Anyone can read' },
                    { Icon: PenLine, text: 'Login to post' },
                    { Icon: Tag, text: 'Tag posts by disease (optional)' },
                    { Icon: Globe, text: 'All disorders welcome' },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-2 text-xs text-gray-500">
                      <item.Icon size={12} className="text-gray-400 shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3">Browse by Role</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Posts', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
                    { key: 'patient', label: 'Patients', cls: 'bg-red-50 text-red-700 border-red-200' },
                    { key: 'donor', label: 'Donors', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                    { key: 'hospital', label: 'Hospitals', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                  ].map(({ key, label, cls }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all
                        ${filter === key ? 'ring-2 ring-red-400' : ''} ${cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-red-600 to-rose-500 rounded-2xl p-5 text-white">
                <h3 className="font-bold mb-3">Community Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-200">Total posts</span>
                    <span className="font-bold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-200">This week</span>
                    <span className="font-bold">
                      {posts.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 86400000)).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  )
}
