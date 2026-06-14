import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, Building2, X } from 'lucide-react'
import api from '../api'

const LABELS = ['Hot Lead','Warm Lead','Cold Lead','Customer']
const LABEL_COLORS = { 'Hot Lead':'#fde8e8,#b91c1c', 'Warm Lead':'#fef3c7,#92400e', 'Cold Lead':'#dbeafe,#1d4ed8', 'Customer':'#dcfce7,#15803d' }

function ContactModal({ contact, onSave, onClose }) {
  const [form, setForm] = useState({ name: contact?.name||'', email: contact?.email||'', phone: contact?.phone||'', label: contact?.label||'', notes: contact?.notes||'', organization_id: contact?.organization_id||'' })
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => { api.get('/organizations').then(r=>setOrgs(r.data)) }, [])

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      if (contact) await api.put(`/contacts/${contact.id}`, form)
      else await api.post('/contacts', form)
      onSave()
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{contact?'Edit Customer':'Add Customer'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required/>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Organization</label>
                <select className="form-control" value={form.organization_id} onChange={e=>set('organization_id',e.target.value)}>
                  <option value="">— None —</option>
                  {orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Label</label>
                <select className="form-control" value={form.label} onChange={e=>set('label',e.target.value)}>
                  <option value="">— None —</option>
                  {LABELS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label>
              <textarea className="form-control" value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}/>
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    api.get(`/contacts?${p}`).then(r=>{ setContacts(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [search])

  const del = async id => {
    if (!confirm('Delete customer?')) return
    await api.delete(`/contacts/${id}`); load()
  }

  const labelStyle = label => {
    const [bg, color] = (LABEL_COLORS[label]||'').split(',')
    return bg ? {background:bg,color,padding:'2px 8px',borderRadius:10,fontSize:11.5,fontWeight:500} : {}
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Customers</h2>
        <div className="topbar-actions">
          <div className="search-wrap"><Search size={14}/>
            <input className="search-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null);setShowModal(true)}}>
            <Plus size={14}/> Add Customer
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Name</th><th>Organization</th><th>Email</th><th>Phone</th><th>Label</th><th>Owner</th><th></th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>Loading…</td></tr>
                : contacts.length===0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'#9ca3af'}}>No customers</td></tr>
                : contacts.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.name}</td>
                    <td>{c.organization_name||'—'}</td>
                    <td>{c.email ? <a href={`mailto:${c.email}`}><Mail size={12} style={{verticalAlign:'middle',marginRight:4}}/>{c.email}</a> : '—'}</td>
                    <td>{c.phone ? <><Phone size={12} style={{verticalAlign:'middle',marginRight:4}}/>{c.phone}</> : '—'}</td>
                    <td>{c.label ? <span style={labelStyle(c.label)}>{c.label}</span> : '—'}</td>
                    <td>{c.owner_name}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(c);setShowModal(true)}}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && <ContactModal contact={editing} onSave={()=>{setShowModal(false);load()}} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}
