import { useState, useEffect } from 'react'
import { Plus, Search, X } from 'lucide-react'
import api from '../api'

function OrgModal({ org, onSave, onClose }) {
  const [form, setForm] = useState({ name:org?.name||'', address:org?.address||'', phone:org?.phone||'', email:org?.email||'', website:org?.website||'', label:org?.label||'' })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      if (org) await api.put(`/organizations/${org.id}`, form)
      else await api.post('/organizations', form)
      onSave()
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{org?'Edit Organization':'Add Organization'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required/>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
              </div>
              <div className="form-group"><label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Website</label>
                <input className="form-control" value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://"/>
              </div>
              <div className="form-group"><label className="form-label">Label</label>
                <select className="form-control" value={form.label} onChange={e=>set('label',e.target.value)}>
                  <option value="">— None —</option>
                  <option>Hot Lead</option><option>Warm Lead</option><option>Cold Lead</option><option>Customer</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Address</label>
              <input className="form-control" value={form.address} onChange={e=>set('address',e.target.value)}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search',search)
    api.get(`/organizations?${p}`).then(r=>{ setOrgs(r.data); setLoading(false) })
  }

  useEffect(()=>{ load() },[search])

  const del = async id => {
    if (!confirm('Delete organization?')) return
    await api.delete(`/organizations/${id}`); load()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Organizations</h2>
        <div className="topbar-actions">
          <div className="search-wrap"><Search size={14}/>
            <input className="search-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null);setShowModal(true)}}>
            <Plus size={14}/> Add Organization
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Contacts</th><th>Open Deals</th><th>Label</th><th>Owner</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>Loading…</td></tr>
                : orgs.length===0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>No organizations</td></tr>
                : orgs.map(o=>(
                  <tr key={o.id}>
                    <td style={{fontWeight:500}}>{o.name}</td>
                    <td>{o.phone||'—'}</td>
                    <td>{o.email||'—'}</td>
                    <td>{o.contact_count||0}</td>
                    <td>{o.deal_count||0}</td>
                    <td>{o.label||'—'}</td>
                    <td>{o.owner_name}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(o);setShowModal(true)}}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(o.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && <OrgModal org={editing} onSave={()=>{setShowModal(false);load()}} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}
