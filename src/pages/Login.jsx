import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginByPhone } from '../firebase/services'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      const employee = await loginByPhone(cleaned)
      if (!employee) {
        toast.error('Mobile number not registered. Contact admin.')
        return
      }
      login(employee)
      toast.success(`Welcome, ${employee.name}!`)
      if (employee.role === 'admin') navigate('/admin')
      else if (employee.role === 'supervisor') navigate('/supervisor')
      else navigate('/dashboard')
    } catch (err) {
      console.error(err)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="mesh-bg" />

      {/* Floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-center">
        {/* Logo / Brand */}
        <div className="login-logo">
          <div className="logo-icon">
            <i className="fas fa-bolt" />
          </div>
          <div>
            <h1 className="logo-title">33KV Attendance</h1>
            <p className="logo-sub">Electrical Department System</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card login-card">
          <div className="login-card-header">
            <h2>Sign In</h2>
            <p className="text-muted text-sm">Enter your registered mobile number</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="input-with-icon">
                <i className="fas fa-phone input-icon" />
                <input
                  type="tel"
                  className="form-input with-icon"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner spinner-sm" /> Checking...</>
              ) : (
                <><i className="fas fa-sign-in-alt" /> Login</>
              )}
            </button>
          </form>

          <p className="login-footer text-muted text-sm text-center mt-4">
            No OTP required · Login with registered number only
          </p>
        </div>

        {/* Role hints */}
        <div className="role-cards">
          {[
            { icon: 'fa-user-hard-hat', label: 'Employee', desc: 'Mark Attendance' },
            { icon: 'fa-user-tie',      label: 'Supervisor', desc: 'Team Dashboard' },
            { icon: 'fa-shield-halved', label: 'Admin', desc: 'Full Control' },
          ].map(r => (
            <div key={r.label} className="role-card glass-card-sm">
              <i className={`fas ${r.icon}`} />
              <span>{r.label}</span>
              <small>{r.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
