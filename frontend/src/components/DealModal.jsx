import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api'

export default function DealModal({ deal, defaultStage, pipelines, onSave, onClose }) {
  const [form, setForm] = useState({
    title: deal?.title || '',
    value: deal?.value || '',
    currency: deal?.currency || 'USD',
    pipeline_id: deal?.pipeline_id || defaultStage?.pipeline_id || pipelines?.[0]?.id || '',
    stage_id: deal?.stage_id || defaultStage?.id || '',
    contact_id: deal?.contact_id || '',
    organization_id: deal?.organization_id || '',
    probability: deal?.probability || 100,
    expected_close_date: deal?.expected_close_date || '',
    label: deal?.label || '',
    status: deal?.status || 'open',
    lost_reason: deal?.lost_reason || '',
    won_reason: deal?.won_reason || '',
  })
  const [contacts, setContacts] = useState([])
  const [orgs, setOrgs] = useState([])
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/contacts').then(r => setContacts(r.data))
    api.get('/organizations').then(r => setOrgs(r.data))
  }, [])

  useEffect(() => {
    const pipeline = pipelines?.find(p => p.id === form.pipeline_id)
    setStages(pipeline?.stages || [])
    if (!deal && pipeline?.stages?.length) {
      setForm(f => ({ ...f, stage_id: defaultStage?.id || pipeline.stages[0].id }))
    }
  }, [form.pipeline_id, pipelines])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (deal) await api.put(`/deals/${deal.id}`, form)
      else await api.post('/deals', form)
      onSave()
    } catch (e) { setError(e.response?.data?.error || 'Error saving deal') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{deal ? 'Edit Deal' : 'Add Deal'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Deal Title *</label>
              <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} required placeholder="e.g. Consulting Services"/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Value</label>
                <input className="form-control" type="number" value={form.value} onChange={e=>set('value',e.target.value)} placeholder="0"/>
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-control" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                  <option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pipeline</label>
                <select className="form-control" value={form.pipeline_id} onChange={e=>set('pipeline_id',e.target.value)}>
                  {pipelines?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-control" value={form.stage_id} onChange={e=>set('stage_id',e.target.value)}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact</label>
                <select className="form-control" value={form.contact_id} onChange={e=>set('contact_id',e.target.value)}>
                  <option value="">— None —</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <select className="form-control" value={form.organization_id} onChange={e=>set('organization_id',e.target.value)}>
                  <option value="">— None —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Probability (%)</label>
                <input className="form-control" type="number" min="0" max="100" value={form.probability} onChange={e=>set('probability',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Close Date</label>
                <input className="form-control" type="date" value={form.expected_close_date} onChange={e=>set('expected_close_date',e.target.value)}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Label</label>
                <input className="form-control" value={form.label} onChange={e=>set('label',e.target.value)} placeholder="e.g. Priority"/>
              </div>
              {deal && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                    <option value="open">Open</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              )}
            </div>
            {form.status === 'lost' && (
              <div className="form-group">
                <label className="form-label">Lost Reason</label>
                <input className="form-control" value={form.lost_reason} onChange={e=>set('lost_reason',e.target.value)}/>
              </div>
            )}
            {form.status === 'won' && (
              <div className="form-group">
                <label className="form-label">Won Reason</label>
                <input className="form-control" value={form.won_reason} onChange={e=>set('won_reason',e.target.value)}/>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Save Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
