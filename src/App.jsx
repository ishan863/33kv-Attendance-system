import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { firebaseConfigured } from './firebase/config'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import SupervisorDashboard from './pages/SupervisorDashboard'
import AdminPanel from './pages/AdminPanel'
import SetupScreen from './pages/SetupScreen'
import SplashScreen from './components/SplashScreen'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const RoleRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />
  return <Navigate to="/dashboard" replace />
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<RoleRedirect />} />
    <Route path="/dashboard" element={
      <ProtectedRoute allowedRoles={['employee','supervisor','admin']}>
        <EmployeeDashboard />
      </ProtectedRoute>
    } />
    <Route path="/supervisor" element={
      <ProtectedRoute allowedRoles={['supervisor','admin']}>
        <SupervisorDashboard />
      </ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminPanel />
      </ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default function App() {
  if (!firebaseConfigured) return <SetupScreen />

  // Show splash only once per browser session
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashDone') === '1'
  )
  const handleSplashDone = () => {
    sessionStorage.setItem('splashDone', '1')
    setSplashDone(true)
  }

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e3f',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
