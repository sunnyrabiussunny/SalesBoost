import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Phone, Mail, Building2, User, Calendar, Plus, Check, Clock } from 'lucide-react'
import api from '../api'
import DealModal from '../components/DealModal'
import ActivityModal from '../components/ActivityModal'
import NoteModal from '../components/NoteModal'

function fmt(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
  return `$${Number(v).toLocaleString()}`
}

const ACTIVITY_ICONS = { call:'📞', meeting:'🤝', task:'✅', deadline:'🚩', email:'📧', lunch:'🍽️' }

export default function DealDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [pipelines, setPipelines] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [tab, setTab] = useState('activities')

  const load = () => api.get(`/deals/${id}`).then(r => setDeal(r.data))
  useEffect(() => { load(); api.get('/pipelines').then(r => setPipelines(r.data)) }, [id])

  const deleteDeal = async () => {
    if (!confirm('Delete this deal?')) return
    await api.delete(`/deals/${id}`)
    navigate('/deals')
  }

  const markDone = async activity => {
    await api.put(`/activities/${activity.id}`, { ...activity, done: activity.done ? 0 : 1 })
    load()
  }

  if (!deal) return <div className="empty-state" style={{marginTop:80}}><p>Loading…</p></div>

  const statusColor = { open: '#3b82f6', won: '#22c55e', lost: '#ef4444' }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate(-1)}><ArrowLeft size={14}/> Back</button>
        <div style={{flex:1,marginLeft:8}}>
          <h2 style={{fontSize:16}}>{deal.title}</h2>
        </div>
        <div className="topbar-actions">
          <span style={{background:statusColor[deal.status]+'22',color:statusColor[deal.status],padding:'3px 10px',borderRadius:10,fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{deal.status}</span>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowEdit(true)}><Edit size={13}/> Edit</button>
          <button className="btn btn-danger btn-sm" onClick={deleteDeal}><Trash2 size={13}/></button>
        </div>
      </div>

      <div className="page-content">
        <div className="deal-detail">
          {/* Main */}
          <div className="deal-detail-main">
            {/* Summary */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="deal-summary-grid">
                  <div>
                    <div className="stat-label">Deal Value</div>
                    <div className="stat-value" style={{fontSize:22}}>{fmt(deal.value)}</div>
                  </div>
                  <div>
                    <div className="stat-label">Stage</div>
                    <div style={{fontWeight:600,fontSize:15,marginTop:4}}>{deal.stage_name}</div>
                  </div>
                  <div>
                    <div className="stat-label">Probability</div>
                    <div style={{fontWeight:600,fontSize:15,marginTop:4}}>{deal.probability}%</div>
                  </div>
                  <div>
                    <div className="stat-label">Expected Close</div>
                    <div style={{fontWeight:600,fontSize:15,marginTop:4}}>{deal.expected_close_date||'—'}</div>
                  </div>
                </div>
                {deal.label && <div style={{marginTop:12}}><span className="deal-label" style={{background:'#ede9fe',color:'#6d28d9'}}>{deal.label}</span></div>}
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {['activities','notes'].map(t => (
                <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
              ))}
            </div>

            {tab === 'activities' && (
              <div>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>setShowActivity(true)}><Plus size={13}/> Schedule Activity</button>
                </div>
                {deal.activities?.length === 0 && <div className="empty-state"><Calendar size={32}/><p>No activities yet</p></div>}
                <div className="timeline">
                  {deal.activities?.map(a => (
                    <div key={a.id} className="timeline-item">
                      <div className={`activity-icon activity-${a.type}`}>{ACTIVITY_ICONS[a.type]||'📌'}</div>
                      <div className="timeline-content">
                        <div className="timeline-meta">{a.due_date} {a.due_time} · {a.owner_name}</div>
                        <div className="timeline-text" style={{fontWeight:500,textDecoration:a.done?'line-through':'none',color:a.done?'#9ca3af':'inherit'}}>{a.title}</div>
                        {a.note && <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{a.note}</div>}
                      </div>
                      <button className={`btn btn-sm ${a.done?'btn-secondary':'btn-ghost'}`} onClick={()=>markDone(a)} style={{flexShrink:0}}>
                        <Check size={13}/>{a.done?'Done':'Mark done'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'notes' && (
              <div>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>setShowNote(true)}><Plus size={13}/> Add Note</button>
                </div>
                {deal.notes?.length === 0 && <div className="empty-state"><p>No notes yet</p></div>}
                {deal.notes?.map(n => (
                  <div key={n.id} className="card mb-3">
                    <div className="card-body" style={{padding:14}}>
                      <div style={{fontSize:12,color:'#9ca3af',marginBottom:6}}>{n.owner_name} · {new Date(n.created_at).toLocaleDateString()}</div>
                      <div style={{fontSize:13.5,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{n.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="deal-detail-sidebar">
            {/* Customer */}
            <div className="card">
              <div className="card-header"><span style={{fontWeight:600,fontSize:13}}>Customer</span></div>
              <div className="card-body" style={{padding:'12px 16px'}}>
                {deal.contact_name ? (
                  <>
                    <div style={{fontWeight:500,marginBottom:4}}><User size={13} style={{marginRight:6,verticalAlign:'middle'}}/>{deal.contact_name}</div>
                    {deal.contact_email && <div style={{fontSize:12,color:'#6b7280'}}><Mail size={11} style={{marginRight:4,verticalAlign:'middle'}}/>{deal.contact_email}</div>}
                    {deal.contact_phone && <div style={{fontSize:12,color:'#6b7280',marginTop:2}}><Phone size={11} style={{marginRight:4,verticalAlign:'middle'}}/>{deal.contact_phone}</div>}
                  </>
                ) : <span style={{color:'#9ca3af',fontSize:13}}>No customer linked</span>}
              </div>
            </div>

            {/* Organization */}
            <div className="card">
              <div className="card-header"><span style={{fontWeight:600,fontSize:13}}>Organization</span></div>
              <div className="card-body" style={{padding:'12px 16px'}}>
                {deal.organization_name
                  ? <div style={{fontWeight:500}}><Building2 size={13} style={{marginRight:6,verticalAlign:'middle'}}/>{deal.organization_name}</div>
                  : <span style={{color:'#9ca3af',fontSize:13}}>No organization</span>}
              </div>
            </div>

            {/* Owner */}
            <div className="card">
              <div className="card-header"><span style={{fontWeight:600,fontSize:13}}>Owner</span></div>
              <div className="card-body" style={{padding:'12px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="deal-card-owner" style={{width:28,height:28,fontSize:12}}>{deal.owner_name?.[0]?.toUpperCase()}</div>
                  <span style={{fontSize:13}}>{deal.owner_name}</span>
                </div>
              </div>
            </div>

            {/* Products */}
            {deal.products?.length > 0 && (
              <div className="card">
                <div className="card-header"><span style={{fontWeight:600,fontSize:13}}>Products</span></div>
                <div className="card-body" style={{padding:'12px 16px'}}>
                  {deal.products.map(p => (
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13,borderBottom:'1px solid #f3f4f6'}}>
                      <span>{p.product_name} × {p.quantity}</span>
                      <span style={{fontWeight:500}}>${(p.unit_price||0)*p.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deal.lost_reason && (
              <div className="card" style={{borderColor:'#fca5a5'}}>
                <div className="card-body" style={{padding:'12px 16px'}}>
                  <div style={{fontSize:12,color:'#b91c1c',fontWeight:500,marginBottom:4}}>Lost Reason</div>
                  <div style={{fontSize:13}}>{deal.lost_reason}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && <DealModal deal={deal} pipelines={pipelines} onSave={()=>{setShowEdit(false);load()}} onClose={()=>setShowEdit(false)}/>}
      {showActivity && <ActivityModal dealId={id} onSave={()=>{setShowActivity(false);load()}} onClose={()=>setShowActivity(false)}/>}
      {showNote && <NoteModal dealId={id} onSave={()=>{setShowNote(false);load()}} onClose={()=>setShowNote(false)}/>}
    </div>
  )
}
