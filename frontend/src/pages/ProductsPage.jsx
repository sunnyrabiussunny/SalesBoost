import { useState, useEffect } from 'react'
import { Plus, X, Package } from 'lucide-react'
import api from '../api'

function ProductModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:'', code:'', description:'', unit:'unit', price:'', tax:'', category:'' })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/products', form); onSave() } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Add Product</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required/>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Code/SKU</label>
                <input className="form-control" value={form.code} onChange={e=>set('code',e.target.value)}/>
              </div>
              <div className="form-group"><label className="form-label">Category</label>
                <input className="form-control" value={form.category} onChange={e=>set('category',e.target.value)}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Price</label>
                <input className="form-control" type="number" step="0.01" value={form.price} onChange={e=>set('price',e.target.value)}/>
              </div>
              <div className="form-group"><label className="form-label">Tax (%)</label>
                <input className="form-control" type="number" step="0.1" value={form.tax} onChange={e=>set('tax',e.target.value)}/>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Unit</label>
              <input className="form-control" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="e.g. unit, hour, month"/>
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={e=>set('description',e.target.value)} rows={2}/>
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

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const del = async id => {
    if (!confirm('Delete product?')) return
    await api.delete(`/products/${id}`); load()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Products</h2>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}><Plus size={14}/> Add Product</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? <div className="empty-state"><p>Loading…</p></div>
        : products.length===0 ? <div className="empty-state"><Package size={32}/><p>No products yet. Add your product catalog here.</p></div>
        : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Code</th><th>Category</th><th>Price</th><th>Tax</th><th>Unit</th><th></th></tr></thead>
                <tbody>
                  {products.map(p=>(
                    <tr key={p.id}>
                      <td style={{fontWeight:500}}>{p.name}</td>
                      <td>{p.code||'—'}</td>
                      <td>{p.category||'—'}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>{p.tax}%</td>
                      <td>{p.unit||'—'}</td>
                      <td><button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(p.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showModal && <ProductModal onSave={()=>{setShowModal(false);load()}} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}
