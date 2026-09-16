import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'cute-wall'

function App() {
  const [route, setRoute] = useState(window.location.pathname)
  const [form, setForm] = useState({ name: '', message: '', photo: null, preview: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [login, setLogin] = useState({ username: '', password: '' })
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('cute-wall-admin') === 'true')
  const [submissions, setSubmissions] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = (path) => { window.history.pushState({}, '', path); setRoute(path); setStatus({ type: '', message: '' }) }
  useEffect(() => { const onPop = () => setRoute(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  useEffect(() => { const input = document.querySelector('input[type="file"]'); if (input) input.setAttribute('capture', 'environment') }, [])
  useEffect(() => {
    if (route !== '/admin' || !isAdmin || !isSupabaseConfigured) return undefined
    let active = true
    supabase.from('submissions').select('*').order('created_at', { ascending: false }).then(({ data, error }) => { if (active && error) setStatus({ type: 'error', message: error.message }); if (active && data) setSubmissions(data) })
    const channel = supabase.channel('submissions-live').on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
      if (payload.eventType === 'INSERT') { setSubmissions((items) => [payload.new, ...items.filter((item) => item.id !== payload.new.id)]); setStatus({ type: 'success', message: 'New submission received.' }) }
      if (payload.eventType === 'DELETE') setSubmissions((items) => items.filter((item) => item.id !== payload.old.id))
    }).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [isAdmin, route])

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const selectPhoto = (file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setStatus({ type: 'error', message: 'Please choose a JPG, PNG, or WebP image.' })
    if (file.size > 5 * 1024 * 1024) return setStatus({ type: 'error', message: 'Please choose an image smaller than 5 MB.' })
    updateForm('photo', file); updateForm('preview', URL.createObjectURL(file)); setStatus({ type: '', message: '' })
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.message.trim() || !form.photo) return setStatus({ type: 'error', message: 'Please complete your name, message, and photo.' })
    if (!isSupabaseConfigured) return setStatus({ type: 'error', message: 'Supabase is not configured yet. Add the values from .env.example.' })
    setIsSubmitting(true)
    const path = `${crypto.randomUUID()}-${form.photo.name.replace(/[^a-z0-9.-]/gi, '-')}`
    const upload = await supabase.storage.from('photos').upload(path, form.photo, { contentType: form.photo.type })
    if (upload.error) { setIsSubmitting(false); return setStatus({ type: 'error', message: upload.error.message }) }
    const { data: publicData } = supabase.storage.from('photos').getPublicUrl(path)
    const result = await supabase.from('submissions').insert({ name: form.name.trim(), message: form.message.trim(), image_url: publicData.publicUrl, image_path: path }).select().single()
    setIsSubmitting(false)
    if (result.error) { await supabase.storage.from('photos').remove([path]); return setStatus({ type: 'error', message: result.error.message }) }
    setForm({ name: '', message: '', photo: null, preview: '' }); setStatus({ type: 'success', message: 'Added Successfully!' })
  }
  const filtered = useMemo(() => [...submissions].filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)), [search, sort, submissions])
  const logout = () => { sessionStorage.removeItem('cute-wall-admin'); setIsAdmin(false); navigate('/admin/login') }

  if (route === '/admin/login') return <Login login={login} setLogin={setLogin} status={status} onLogin={() => { if (login.username === adminUsername && login.password === adminPassword) { sessionStorage.setItem('cute-wall-admin', 'true'); setIsAdmin(true); navigate('/admin') } else setStatus({ type: 'error', message: 'Invalid username or password.' }) }} onBack={() => navigate('/')} />
  if (route === '/admin' && isAdmin) return <Dashboard submissions={filtered} search={search} setSearch={setSearch} sort={sort} setSort={setSort} status={status} logout={logout} onDelete={async (item) => { if (!window.confirm('Delete this submission?')) return; await supabase.from('submissions').delete().eq('id', item.id); if (item.image_path) await supabase.storage.from('photos').remove([item.image_path]) }} />
  if (route === '/admin') { navigate('/admin/login'); return null }
  return <main className="shell"><header className="topbar"><span className="brand">♡ Cute Photo Wall</span><nav className="top-actions"><a className="instagram-link" href="https://www.instagram.com/_krish_mankind/" target="_blank" rel="noreferrer">◎ Instagram</a><button className="text-button" onClick={() => navigate('/admin/login')}>Admin</button></nav></header><section className="hero-copy"><p className="eyebrow">A tiny corner for big feelings</p><h1>Share a Cute Moment <span>💕</span></h1><p>Upload a photo and leave a little message.</p></section><form className="form-card" onSubmit={submit}><label>Name<input value={form.name} maxLength="50" onChange={(e) => updateForm('name', e.target.value)} placeholder="Enter your name" /></label><label>Message<textarea value={form.message} maxLength="250" onChange={(e) => updateForm('message', e.target.value)} placeholder="Write something..." rows="4" /></label><label>Upload Cute Photo<div className={`upload ${form.preview ? 'has-preview' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectPhoto(e.target.files[0])} />{form.preview ? <><img src={form.preview} alt="Selected preview" /><span>{form.photo.name}</span><button type="button" className="replace" onClick={(e) => { e.stopPropagation(); updateForm('photo', null); updateForm('preview', '') }}>Replace photo</button></> : <><strong>📸 Upload your cute photo</strong><small>JPG, PNG or WebP · up to 5 MB</small></>}</div></label>{status.message && <div className={`notice ${status.type}`}>{status.message}{status.message === '💕 Added Successfully!' && <button type="button" onClick={() => setStatus({ type: '', message: '' })}>Add Another</button>}</div>}<button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add to Wall'} <span>→</span></button></form><footer>Made with a little extra sweetness <span>✦</span></footer></main>
}

function Login({ login, setLogin, status, onLogin, onBack }) { return <main className="auth-shell"><button className="back" onClick={onBack}>← Back to wall</button><section className="auth-card"><p className="eyebrow">Private corner</p><h1>Admin Login</h1><p>Welcome back to your photo wall.</p><form onSubmit={(e) => { e.preventDefault(); onLogin() }}><label>Username<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></label><label>Password<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>{status.message && <div className="notice error">{status.message}</div>}<button className="primary">Login <span>→</span></button></form></section></main> }
function Dashboard({ submissions, search, setSearch, sort, setSort, status, logout, onDelete }) { const today = submissions.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length; return <main className="dashboard"><header className="dash-header"><div><p className="eyebrow">Your private view</p><h1>Cute Photo Wall <span>— Admin Panel</span></h1></div><div className="actions"><button className="text-button active">Dashboard</button><a className="instagram-link" href="https://www.instagram.com/_krish_mankind/" target="_blank" rel="noreferrer">◎ Instagram</a><button className="text-button" onClick={logout}>Logout</button></div></header>{status.message && <div className="toast">{status.message}</div>}<section className="stats"><div><small>Total submissions</small><strong>{submissions.length}</strong></div><div><small>Today's submissions</small><strong>{today}</strong></div><div><small>Latest submission</small><strong>{submissions[0] ? new Date(submissions[0].created_at).toLocaleDateString() : '—'}</strong></div></section><div className="gallery-tools"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." /><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div><section className="gallery">{submissions.length ? submissions.map((item) => <article className="submission-card" key={item.id}><a href={item.image_url} target="_blank" rel="noreferrer"><img src={item.image_url} alt={`Uploaded by ${item.name}`} /></a><div className="card-body"><strong>{item.name}</strong><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small><button className="delete" onClick={() => onDelete(item)}>Delete</button></div></article>) : <div className="empty">No submissions yet. Your wall is waiting for its first sweet moment.</div>}</section></main> }

export default App
