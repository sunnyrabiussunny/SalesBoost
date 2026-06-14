import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import api from '../api'

export default function StageModal({ pipelineId, stage, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: stage?.name || '',
    probability: stage?.probability ?? 50,
    rotting_days: stage?.rotting_days ?? 14,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (stage) await api.put(`/pipelines/${pipelineId}/stages/${stage.id}`, form)
      else await api.post(`/pipelines/${pipelineId}/stages`, form)
      onSave()
    } catch (e) { setError(e.response?.data?.error || 'Error saving stage') }
    finally { setLoading(false) }
  }

  const del = async () => {
    if (!confirm(`Delete stage "${stage.name}"? Deals in this stage will need to be moved manually.`)) return
    setLoading(true)
    try { await api.delete(`/pipelines/${pipelineId}/stages/${stage.id}`); onDelete() }
    catch (e) { setError(e.response?.data?.error || 'Error deleting stage') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{stage ? 'Edit Stage' : 'Add Stage'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Stage Name *</label>
              <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="e.g. Proposal Sent"/>
            </div>
            <div className="form-group">
              <label className="form-label">Default Win Probability (%)</label>
              <input className="form-control" type="number" min="0" max="100" value={form.probability} onChange={e=>set('probability', e.target.value)}/>
              <div className="form-hint">New deals created in this stage will default to this probability.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Rotting Threshold (days)</label>
              <input className="form-control" type="number" min="0" value={form.rotting_days} onChange={e=>set('rotting_days', e.target.value)}/>
              <div className="form-hint">Deals with no activity for this many days will show a rotting warning.</div>
            </div>
          </div>
          <div className="modal-footer">
            {stage && (
              <button type="button" className="btn btn-danger" onClick={del} disabled={loading} style={{marginRight:'auto'}}>
                <Trash2 size={13}/> Delete Stage
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
