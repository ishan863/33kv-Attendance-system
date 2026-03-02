import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const roleLabel = { employee: 'Employee', supervisor: 'Supervisor', admin: 'Admin' }
  const roleBadgeColor = { employee: '#4f8ef7', supervisor: '#a855f7', admin: '#f59e0b' }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <i className="fas fa-bolt" style={{ color: '#00e5ff' }} />
        <span>33KV Attendance</span>
      </div>

      <div className="navbar-actions">
        {/* Nav Links */}
        { (user?.role === 'supervisor' || user?.role === 'admin') && (
          <button
            className={`btn btn-ghost btn-sm ${location.pathname === '/supervisor' ? 'btn-active' : ''}`}
            onClick={() => navigate('/supervisor')}
          >
            <i className="fas fa-table-cells" /> <span className="nav-label">Team View</span>
          </button>
        )}
        { user?.role === 'admin' && (
          <button
            className={`btn btn-ghost btn-sm ${location.pathname === '/admin' ? 'btn-active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <i className="fas fa-shield-halved" /> <span className="nav-label">Admin</span>
          </button>
        )}
        { user?.role !== 'admin' && (
          <button
            className={`btn btn-ghost btn-sm ${location.pathname === '/dashboard' ? 'btn-active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-house" /> <span className="nav-label">My Dashboard</span>
          </button>
        )}

        {/* User Chip */}
        {user && (
          <div className="user-chip">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role" style={{ color: roleBadgeColor[user.role] }}>
                {roleLabel[user.role]}
              </span>
            </div>
          </div>
        )}

        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
          <i className="fas fa-right-from-bracket" />
        </button>
      </div>

      <style>{`
        .btn-active { background: rgba(79,142,247,0.15) !important; color: var(--accent-blue) !important; }
        .user-chip { display:flex; align-items:center; gap:8px; padding: 6px 10px; background: rgba(255,255,255,0.06); border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); }
        .user-avatar { width:30px; height:30px; border-radius:50%; background: linear-gradient(135deg,#4f8ef7,#a855f7); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:white; flex-shrink:0; }
        .user-info { display:flex; flex-direction:column; line-height:1.2; }
        .user-name { font-size:12px; font-weight:600; color:var(--text-primary); }
        .user-role { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; }
        .nav-label { display:inline; }
        @media(max-width:600px){
          .user-info { display:none; }
          .nav-label { display:none; }
          .navbar-brand span { font-size:13px; }
          .navbar-actions { gap:4px; }
          .btn-ghost.btn-sm { padding:8px 10px; min-width:36px; }
        }
      `}</style>
    </nav>
  )
}
