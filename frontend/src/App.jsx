import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import PipelinePage from './pages/PipelinePage'
import DealsListPage from './pages/DealsListPage'
import DealDetailPage from './pages/DealDetailPage'
import ContactsPage from './pages/ContactsPage'
import OrganizationsPage from './pages/OrganizationsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import ReportsPage from './pages/ReportsPage'
import ProductsPage from './pages/ProductsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#6b7280'}}>Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/pipeline" replace />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="deals" element={<DealsListPage />} />
            <Route path="deals/:id" element={<DealDetailPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="products" element={<ProductsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
