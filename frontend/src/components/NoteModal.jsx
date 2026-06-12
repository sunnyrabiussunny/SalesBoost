import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api'

export default function NoteModal({ dealId, contactId, organizationId, onSave, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    await api.post('/notes', { content, deal_id:dealId||null, contact_id:contactId||null, organization_id:organizationId||null })
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add Note</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Note *</label>
              <textarea className="form-control" value={content} onChange={e=>setContent(e.target.value)} rows={5} required placeholder="Write your note here…"/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Save Note'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
