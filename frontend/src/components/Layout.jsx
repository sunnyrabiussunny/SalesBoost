import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTour } from '../TourContext'
import TourOverlay from './TourOverlay'
import { Users, Building2, Activity, BarChart3, Package, LogOut, Kanban, List, Settings, Compass, MoreHorizontal, X } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/pipeline', icon: Kanban, label: 'Pipeline', section: 'Pipeline' },
  { to: '/deals', icon: List, label: 'All Deals', section: 'Pipeline' },
  { to: '/contacts', icon: Users, label: 'Customers', section: 'People' },
  { to: '/organizations', icon: Building2, label: 'Organizations', section: 'People' },
  { to: '/activities', icon: Activity, label: 'Activities', section: 'Work' },
  { to: '/products', icon: Package, label: 'Products', section: 'Work' },
  { to: '/reports', icon: BarChart3, label: 'Reports', section: 'Insights' },
]

// Subset shown in the mobile bottom bar (max 5 for thumb reach, rest go in "More")
const MOBILE_NAV = [
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/deals', icon: List, label: 'Deals' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/contacts', icon: Users, label: 'Customers' },
]

const MORE_ITEMS = [
  { to: '/organizations', icon: Building2, label: 'Organizations' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const tour = useTour()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const startTour = () => { setShowMore(false); tour?.start() }

  let lastSection = null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1><span className="sidebar-logo-icon">💼</span><span className="sidebar-logo-text">SalesBoost</span></h1>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Get Started</div>
          <button onClick={startTour} title="Start Here" style={{
            display:'flex',alignItems:'center',gap:10,padding:'10px 16px',width:'100%',
            background:'transparent',border:'none',color:'#fbbf24',fontSize:'13.5px',fontWeight:600,cursor:'pointer'
          }}>
            <Compass size={16}/><span className="sidebar-label">Start Here</span>
          </button>
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

      {/* Mobile branding header (sidebar hidden on small screens) */}
      <div className="mobile-topbar-brand">
        <span style={{fontSize:18}}>💼</span> SalesBoost
        <div style={{flex:1}}/>
        <button onClick={startTour} style={{
          display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.1)',
          border:'none',color:'#fbbf24',fontSize:12,fontWeight:600,padding:'5px 10px',borderRadius:6
        }}>
          <Compass size={13}/> Start Here
        </button>
      </div>

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
        <button className="mobile-nav-item" onClick={()=>setShowMore(true)}>
          <MoreHorizontal size={20}/>
          <span>More</span>
        </button>
      </nav>

      {showMore && (
        <div className="mobile-more-sheet-overlay" onClick={e=>e.target===e.currentTarget&&setShowMore(false)}>
          <div className="mobile-more-sheet">
            <div className="mobile-more-sheet-handle"/>
            {MORE_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} className="mobile-more-sheet-item" onClick={()=>setShowMore(false)}>
                  <Icon size={18}/>{item.label}
                </NavLink>
              )
            })}
            <button className="mobile-more-sheet-item" onClick={startTour}>
              <Compass size={18}/>Start Here (Tour)
            </button>
            <button className="mobile-more-sheet-item" onClick={handleLogout} style={{color:'var(--danger)'}}>
              <LogOut size={18}/>Logout
            </button>
            <button className="mobile-more-sheet-item" onClick={()=>setShowMore(false)} style={{color:'var(--text-muted)',justifyContent:'center'}}>
              <X size={16}/>Close
            </button>
          </div>
        </div>
      )}

      <TourOverlay/>
    </div>
  )
}
