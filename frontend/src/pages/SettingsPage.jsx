import { useState, useEffect } from 'react'
import { Lock, UserPlus, Trash2, Shield, Users as UsersIcon, X } from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'

function ChangePasswordCard() {
  const [form, setForm] = useState({ current_password:'', new_password:'', confirm:'' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.new_password !== form.confirm) { setMsg({type:'error', text:'New passwords do not match'}); return }
    if (form.new_password.length < 6) { setMsg({type:'error', text:'New password must be at least 6 characters'}); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', { current_password: form.current_password, new_password: form.new_password })
      setMsg({type:'success', text:'Password updated successfully'})
      setForm({ current_password:'', new_password:'', confirm:'' })
    } catch (e) {
      setMsg({type:'error', text: e.response?.data?.error || 'Error changing password'})
    } finally { setLoading(false) }
  }

  return (
    <div className="card mb-4">
      <div className="card-header"><span style={{fontWeight:600,fontSize:14}}><Lock size={15} style={{verticalAlign:'middle',marginRight:6}}/>Change Password</span></div>
      <div className="card-body">
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-control" type="password" value={form.current_password} onChange={e=>set('current_password',e.target.value)} required/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" value={form.new_password} onChange={e=>set('new_password',e.target.value)} required minLength={6}/>
              <div className="form-hint">At least 6 characters</div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} required minLength={6}/>
            </div>
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading?'Updating…':'Update Password'}</button>
        </form>
      </div>
    </div>
  )
}

function AddUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await api.post('/auth/users', form); onSave() }
    catch (e) { setError(e.response?.data?.error || 'Error creating user') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Add User</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group"><label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required/>
            </div>
            <div className="form-group"><label className="form-label">Email *</label>
              <input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)} required/>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Password *</label>
                <input className="form-control" type="password" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6}/>
              </div>
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={e=>set('role',e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Creating…':'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ targetUser, onSave, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.put(`/auth/users/${targetUser.id}/reset-password`, { new_password: password })
      onSave()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Reset Password for {targetUser.name}</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group"><label className="form-label">New Password</label>
              <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/>
              <div className="form-hint">At least 6 characters</div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Reset Password'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserManagementCard() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/users').then(r => { setUsers(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const toggleRole = async u => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`Change ${u.name}'s role to ${newRole}?`)) return
    await api.put(`/auth/users/${u.id}/role`, { role: newRole })
    load()
  }

  const del = async u => {
    if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return
    try { await api.delete(`/auth/users/${u.id}`); load() }
    catch (e) { alert(e.response?.data?.error || 'Error deleting user') }
  }

  if (currentUser?.role !== 'admin') return null

  return (
    <div className="card">
      <div className="card-header">
        <span style={{fontWeight:600,fontSize:14}}><UsersIcon size={15} style={{verticalAlign:'middle',marginRight:6}}/>Team Members</span>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}><UserPlus size={14}/> Add User</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{textAlign:'center',padding:30,color:'#9ca3af'}}>Loading…</td></tr>
            : users.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:500}}>{u.name}{u.id===currentUser.id && <span className="text-muted text-sm"> (you)</span>}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role==='admin'?'badge-won':'badge-open'}`} style={{textTransform:'capitalize'}}>
                    {u.role==='admin' && <Shield size={11} style={{marginRight:3,verticalAlign:'middle'}}/>}
                    {u.role}
                  </span>
                </td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setResetTarget(u)}>Reset Password</button>
                    {u.id !== currentUser.id && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={()=>toggleRole(u)}>
                          Make {u.role==='admin'?'User':'Admin'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(u)}><Trash2 size={13}/></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && <AddUserModal onSave={()=>{setShowAdd(false);load()}} onClose={()=>setShowAdd(false)}/>}
      {resetTarget && <ResetPasswordModal targetUser={resetTarget} onSave={()=>{setResetTarget(null);alert('Password reset successfully')}} onClose={()=>setResetTarget(null)}/>}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar"><h2>Settings</h2></div>
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Account</span></div>
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="sidebar-user-avatar" style={{width:40,height:40,fontSize:16}}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{fontWeight:600}}>{user?.name}</div>
                <div className="text-muted text-sm">{user?.email} · <span style={{textTransform:'capitalize'}}>{user?.role}</span></div>
              </div>
            </div>
          </div>
        </div>
        <ChangePasswordCard/>
        <UserManagementCard/>
      </div>
    </div>
  )
}
