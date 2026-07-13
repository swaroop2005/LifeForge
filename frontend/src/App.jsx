import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/Landing/LandingPage'
import RoleAuth from './pages/Auth/RoleAuth'
import PatientDashboard from './pages/Patient/PatientDashboard'
import DonorDashboard from './pages/Donor/DonorDashboard'
import HospitalDashboard from './pages/Hospital/HospitalDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminLogin from './pages/Admin/AdminLogin'
import CommunityPage from './pages/Community/CommunityPage'
import LeaderboardPage from './pages/Donor/LeaderboardPage'

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('vt_token')
  const role = localStorage.getItem('vt_role')
  if (!token) return <Navigate to="/" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to={`/${role}`} replace />
  return children
}

function PublicRoute({ children, allowedRole }) {
  const token = localStorage.getItem('vt_token')
  const role = localStorage.getItem('vt_role')
  if (token && (!allowedRole || role === allowedRole)) return <Navigate to={`/${role}`} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicRoute><LandingPage /></PublicRoute>
        } />

        {/* Role-specific auth portals */}
        <Route path="/login/patient" element={
          <PublicRoute allowedRole="patient"><RoleAuth role="patient" /></PublicRoute>
        } />
        <Route path="/login/donor" element={
          <PublicRoute allowedRole="donor"><RoleAuth role="donor" /></PublicRoute>
        } />
        <Route path="/login/hospital" element={
          <PublicRoute allowedRole="hospital"><RoleAuth role="hospital" /></PublicRoute>
        } />
        <Route path="/admin-login" element={
          <PublicRoute allowedRole="admin"><AdminLogin /></PublicRoute>
        } />

        {/* Protected dashboards */}
        <Route path="/patient" element={
          <ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>
        } />
        <Route path="/donor" element={
          <ProtectedRoute allowedRole="donor"><DonorDashboard /></ProtectedRoute>
        } />
        <Route path="/hospital" element={
          <ProtectedRoute allowedRole="hospital"><HospitalDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/community" element={<CommunityPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
