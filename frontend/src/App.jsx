import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Scraper from './pages/Scraper'
import History from './pages/History'
import Alerts from './pages/Alerts'
import AlertDetail from './pages/AlertDetail'
import Profile from './pages/Profile'
import ScrapedReports from './pages/ScrapedReports'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import Sources from './pages/Sources'
import HazardPortal from './pages/HazardPortal'
import Users from './pages/Users'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="analytics-dashboard" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="scraper" element={<ProtectedRoute><Scraper /></ProtectedRoute>} />
        <Route path="scraped-reports" element={<ProtectedRoute><ScrapedReports /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="alerts/:id" element={<ProtectedRoute><AlertDetail /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="sources" element={<ProtectedRoute><Sources /></ProtectedRoute>} />
        <Route path="hazard-portal" element={<ProtectedRoute><HazardPortal /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
