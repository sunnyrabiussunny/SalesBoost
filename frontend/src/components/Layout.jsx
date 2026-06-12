import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LayoutDashboard, Users, Building2, Activity, BarChart3, Package, LogOut, Kanban, List, Bell } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>💼 SalesBoost</h1>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Pipeline</div>
          <NavLink to="/pipeline"><Kanban size={16}/>Pipeline</NavLink>
          <NavLink to="/deals"><List size={16}/>All Deals</NavLink>
          <div className="sidebar-section">People</div>
          <NavLink to="/contacts"><Users size={16}/>Contacts</NavLink>
          <NavLink to="/organizations"><Building2 size={16}/>Organizations</NavLink>
          <div className="sidebar-section">Work</div>
          <NavLink to="/activities"><Activity size={16}/>Activities</NavLink>
          <NavLink to="/products"><Package size={16}/>Products</NavLink>
          <div className="sidebar-section">Insights</div>
          <NavLink to="/reports"><BarChart3 size={16}/>Reports</NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" style={{color:'rgba(255,255,255,.4)'}}>
            <LogOut size={15}/>
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
