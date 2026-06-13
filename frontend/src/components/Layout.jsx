import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { Users, Building2, Activity, BarChart3, Package, LogOut, Kanban, List, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/pipeline', icon: Kanban, label: 'Pipeline', section: 'Pipeline' },
  { to: '/deals', icon: List, label: 'All Deals', section: 'Pipeline' },
  { to: '/contacts', icon: Users, label: 'Contacts', section: 'People' },
  { to: '/organizations', icon: Building2, label: 'Organizations', section: 'People' },
  { to: '/activities', icon: Activity, label: 'Activities', section: 'Work' },
  { to: '/products', icon: Package, label: 'Products', section: 'Work' },
  { to: '/reports', icon: BarChart3, label: 'Reports', section: 'Insights' },
]

// Subset shown in the mobile bottom bar (max 5 for thumb reach)
const MOBILE_NAV = [
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/deals', icon: List, label: 'Deals' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  let lastSection = null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1><span className="sidebar-logo-icon">💼</span><span className="sidebar-logo-text">SalesBoost</span></h1>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const showSection = item.section !== lastSection
            lastSection = item.section
            const Icon = item.icon
            return (
              <div key={item.to}>
                {showSection && <div className="sidebar-section">{item.section}</div>}
                <NavLink to={item.to} title={item.label}>
                  <Icon size={16}/><span className="sidebar-label">{item.label}</span>
                </NavLink>
              </div>
            )
          })}
          <div className="sidebar-section">Account</div>
          <NavLink to="/settings" title="Settings"><Settings size={16}/><span className="sidebar-label">Settings</span></NavLink>
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
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className="mobile-nav-item">
              <Icon size={20}/>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
