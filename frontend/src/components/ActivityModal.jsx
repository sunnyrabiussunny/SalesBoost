import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api'

const TYPES = ['call','meeting','task','deadline','email','lunch']

export default function ActivityModal({ dealId, contactId, onSave, onClose }) {
  const [form, setForm] = useState({ type:'call', title:'', due_date:'', due_time:'', duration:'', note:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/activities', { ...form, deal_id: dealId||null, contact_id: contactId||null })
      onSave()
    } catch(e) { setError(e.response?.data?.error || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Schedule Activity</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Type</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {TYPES.map(t => (
                  <button key={t} type="button" onClick={()=>set('type',t)}
                    className={`btn btn-sm ${form.type===t?'btn-primary':'btn-secondary'}`}
                    style={{textTransform:'capitalize'}}>{t}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} required placeholder={`e.g. Follow-up ${form.type}`}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-control" type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input className="form-control" type="time" value={form.due_time} onChange={e=>set('due_time',e.target.value)}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-control" value={form.note} onChange={e=>set('note',e.target.value)} rows={3}/>
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
