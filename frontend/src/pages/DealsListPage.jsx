import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import api from '../api'
import DealModal from '../components/DealModal'

function fmt(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
  if (v >= 1000) return `$${(v/1000).toFixed(0)}K`
  return `$${Number(v).toLocaleString()}`
}

export default function DealsListPage() {
  const navigate = useNavigate()
  const [deals, setDeals] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('open')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (search) params.set('search', search)
    api.get(`/deals?${params}`).then(r => { setDeals(r.data); setLoading(false) })
  }

  useEffect(() => {
    api.get('/pipelines').then(r => setPipelines(r.data))
  }, [])

  useEffect(() => { load() }, [status, search])

  const statusBadge = s => {
    if (s === 'won') return <span className="badge badge-won">Won</span>
    if (s === 'lost') return <span className="badge badge-lost">Lost</span>
    return <span className="badge badge-open">Open</span>
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>All Deals</h2>
        <div className="topbar-actions">
          <div className="search-wrap">
            <Search size={14}/>
            <input className="search-input" placeholder="Search deals…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-control" style={{width:120}} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>
            <Plus size={14}/> Add Deal
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organization</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Pipeline</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>Loading…</td></tr>
                ) : deals.length === 0 ? (
                  <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>No deals found</td></tr>
                ) : deals.map(d => (
                  <tr key={d.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/deals/${d.id}`)}>
                    <td style={{fontWeight:500,color:'var(--accent)'}}>{d.title}</td>
                    <td>{d.organization_name || '—'}</td>
                    <td>{d.contact_name || '—'}</td>
                    <td>{d.stage_name}</td>
                    <td>{d.pipeline_name}</td>
                    <td style={{fontWeight:600}}>{fmt(d.value)}</td>
                    <td>{statusBadge(d.status)}</td>
                    <td>{d.owner_name}</td>
                    <td>{d.expected_close_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && <DealModal pipelines={pipelines} onSave={()=>{setShowModal(false);load()}} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}
