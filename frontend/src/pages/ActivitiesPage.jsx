import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, Calendar } from 'lucide-react'
import api from '../api'
import ActivityModal from '../components/ActivityModal'

const ACTIVITY_ICONS = { call:'📞', meeting:'🤝', task:'✅', deadline:'🚩', email:'📧', lunch:'🍽️' }

export default function ActivitiesPage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState('pending')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter === 'pending') p.set('done', 'false')
    if (filter === 'done') p.set('done', 'true')
    api.get(`/activities?${p}`).then(r => { setActivities(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [filter])

  const markDone = async a => {
    await api.put(`/activities/${a.id}`, { ...a, done: a.done ? 0 : 1 })
    load()
  }

  const del = async id => {
    if (!confirm('Delete this activity?')) return
    await api.delete(`/activities/${id}`)
    load()
  }

  const today = new Date().toISOString().slice(0,10)
  const isOverdue = a => a.due_date && a.due_date < today && !a.done

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Activities</h2>
        <div className="topbar-actions">
          <div className="tabs" style={{border:'none',marginBottom:0}}>
            {['pending','done','all'].map(f => (
              <button key={f} className={`tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)} style={{textTransform:'capitalize',padding:'8px 12px'}}>{f}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}><Plus size={14}/> Schedule Activity</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : activities.length === 0 ? (
          <div className="empty-state"><Calendar size={32}/><p>No activities found</p></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th></th><th>Title</th><th>Type</th><th>Date</th><th>Time</th><th>Linked To</th><th>Owner</th><th>Note</th><th></th></tr></thead>
                <tbody>
                  {activities.map(a => (
                    <tr key={a.id} style={{background: isOverdue(a) ? '#fef2f2' : 'transparent'}}>
                      <td><div className={`activity-icon activity-${a.type}`} style={{width:24,height:24,fontSize:11}}>{ACTIVITY_ICONS[a.type]}</div></td>
                      <td style={{fontWeight:500, textDecoration: a.done ? 'line-through' : 'none', color: a.done ? '#9ca3af' : 'inherit'}}>{a.title}</td>
                      <td style={{textTransform:'capitalize'}}>{a.type}</td>
                      <td style={{color: isOverdue(a) ? '#b91c1c' : 'inherit', fontWeight: isOverdue(a) ? 600 : 400}}>{a.due_date || '—'}</td>
                      <td>{a.due_time || '—'}</td>
                      <td>
                        {a.deal_title
                          ? <a onClick={(e)=>{e.preventDefault();navigate(`/deals/${a.deal_id}`)}} href="#" style={{cursor:'pointer'}}>{a.deal_title}</a>
                          : a.contact_name || '—'}
                      </td>
                      <td>{a.owner_name}</td>
                      <td style={{maxWidth:200}} className="truncate">{a.note || '—'}</td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className={`btn btn-sm ${a.done?'btn-secondary':'btn-ghost'}`} onClick={()=>markDone(a)}><Check size={13}/></button>
                          <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(a.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showModal && <ActivityModal onSave={()=>{setShowModal(false);load()}} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}
