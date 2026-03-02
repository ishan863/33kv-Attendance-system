import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CameraCapture from '../components/CameraCapture'
import { markAttendance, getTodayAttendance, getEmployeeAttendanceByMonth, applyLeaveDates, getUpcomingLeaves, subscribeToTodayAttendance } from '../firebase/services'
import { format, parseISO, addMonths, subMonths } from 'date-fns'
import './EmployeeDashboard.css'

const STATUS_CONFIG = {
  Present: { color: 'var(--accent-green)', icon: 'fa-check-circle',  label: 'Present',  bg: 'rgba(34,197,94,0.15)' },
  Leave:   { color: 'var(--accent-yellow)', icon: 'fa-calendar-xmark', label: 'Leave',   bg: 'rgba(245,158,11,0.15)' },
  Off:     { color: 'var(--accent-red)',   icon: 'fa-times-circle',   label: 'Off / Absent', bg: 'rgba(239,68,68,0.15)' },
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Today
  const [todayRecord,   setTodayRecord]   = useState(null)
  const [loadingToday,  setLoadingToday]  = useState(true)
  const [showCamera,    setShowCamera]    = useState(false)
  const [submitting,    setSubmitting]    = useState(false)

  // Leave modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveFrom,      setLeaveFrom]      = useState(todayStr)
  const [leaveTo,        setLeaveTo]        = useState(todayStr)
  const [applyingLeave,  setApplyingLeave]  = useState(false)
  const [upcomingLeaves, setUpcomingLeaves] = useState([])

  // History
  const [historyMonth,   setHistoryMonth]   = useState(format(new Date(), 'yyyy-MM'))
  const [historyData,    setHistoryData]    = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [stats,          setStats]          = useState({ present: 0, leave: 0, off: 0 })

  // Photo viewer modal
  const [viewPhoto, setViewPhoto] = useState(null)

  // Deduplicate by date — keep record with photo if multiple exist
  const dedup = (records) => {
    const map = {}
    records.forEach(r => { if (!map[r.date] || r.photoUrl) map[r.date] = r })
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
  }

  const loadHistoryForMonth = useCallback(async (ym) => {
    setHistoryLoading(true)
    setHistoryMonth(ym)
    try {
      const raw  = await getEmployeeAttendanceByMonth(user.id, ym)
      const data = dedup(raw)
      setHistoryData(data)
      setStats({
        present: data.filter(r => r.status === 'Present').length,
        leave:   data.filter(r => r.status === 'Leave').length,
        off:     data.filter(r => r.status === 'Off').length,
      })
    } catch (err) {
      console.error('loadHistoryForMonth', err)
      toast.error('Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }, [user.id])   // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh upcoming leaves (lightweight poll on demand)
  const refreshUpcoming = useCallback(async () => {
    try {
      const upcoming = await getUpcomingLeaves(user.id)
      setUpcomingLeaves(upcoming)
    } catch {}
  }, [user.id])  // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time listener for today's record — auto-updates when any device marks attendance
  useEffect(() => {
    setLoadingToday(true)
    const unsub = subscribeToTodayAttendance(user.id, (rec) => {
      setTodayRecord(rec)
      setLoadingToday(false)
    })
    return unsub
  }, [user.id])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshUpcoming()
    loadHistoryForMonth(format(new Date(), 'yyyy-MM'))
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Keep loadToday as a compat shim for other callers
  const loadToday = useCallback(async () => {
    await refreshUpcoming()
  }, [refreshUpcoming])

  const handleApplyLeave = async () => {
    if (!leaveFrom || !leaveTo) { toast.error('Select dates'); return }
    if (leaveTo < leaveFrom)    { toast.error('End date must be ≥ start date'); return }
    const dates = []
    let cur = new Date(leaveFrom + 'T00:00:00')
    const end = new Date(leaveTo + 'T00:00:00')
    while (cur <= end) { dates.push(format(cur, 'yyyy-MM-dd')); cur.setDate(cur.getDate() + 1) }
    if (dates.length > 31) { toast.error('Max 31 days at once'); return }
    setApplyingLeave(true)
    try {
      await applyLeaveDates({ employeeId: user.id, employeeName: user.name, team: user.team, dates })
      toast.success(`Leave applied for ${dates.length} day${dates.length > 1 ? 's' : ''}! ✅`)
      setShowLeaveModal(false)
      await loadToday()
      // Reload history for the month of leaveFrom
      await loadHistoryForMonth(leaveFrom.substring(0, 7))
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply leave')
    } finally {
      setApplyingLeave(false)
    }
  }

  const handleMarkClick = (status) => {
    if (todayRecord) {
      toast('Attendance already marked for today!', { icon: 'ℹ️' })
      return
    }
    if (status === 'Present') {
      setShowCamera(true)
    } else if (status === 'Leave') {
      setLeaveFrom(todayStr)
      setLeaveTo(todayStr)
      setShowLeaveModal(true)
    } else {
      submitAttendance('Off', null)
    }
  }

  const handlePhotoCapture = (dataUrl) => {
    setShowCamera(false)
    submitAttendance('Present', dataUrl)
  }

  const submitAttendance = async (status, photoDataUrl) => {
    setSubmitting(true)
    try {
      await markAttendance({
        employeeId:   user.id,
        employeeName: user.name,
        team:         user.team,
        status,
        photoDataUrl,
      })
      toast.success(`✅ ${status} marked for today!`)
      await refreshUpcoming()
      const curMonth = format(new Date(), 'yyyy-MM')
      setHistoryMonth(curMonth)
      await loadHistoryForMonth(curMonth)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Check connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const total = stats.present + stats.leave + stats.off
  const pct   = total > 0 ? Math.round((stats.present / total) * 100) : 0
  const circumference = 2 * Math.PI * 36
  const isCurrentMonth    = historyMonth === format(new Date(), 'yyyy-MM')
  const currentMonthLabel = format(new Date(historyMonth + '-02'), 'MMMM yyyy')

  return (
    <div className="page-container emp-page page-enter">
      <div className="mesh-bg" />
      <Navbar />

      <div className="emp-content">
        {/* Header */}
        <div className="emp-header glass-card">
          <div>
            <p className="emp-greeting text-muted">Good {getGreeting()},</p>
            <h1 className="emp-name">{user?.name}</h1>
            <div className="emp-meta">
              <span><i className="fas fa-users" /> {user?.team || 'No Team'}</span>
              <span><i className="fas fa-id-card" /> {user?.designation || 'Employee'}</span>
            </div>
          </div>
          <div className="emp-date-box">
            <div className="emp-date">{format(new Date(), 'dd')}</div>
            <div className="emp-month">{format(new Date(), 'MMM yyyy')}</div>
            <div className="emp-day">{format(new Date(), 'EEEE')}</div>
          </div>
        </div>

        {/* Today's Status */}
        <div className="today-section">
          <h2 className="section-title">
            <span className="live-dot" title="Live" />
            Today's Attendance
          </h2>

          {loadingToday ? (
            <div className="glass-card" style={{ padding:'24px 20px' }}>
              <div className="skeleton skeleton-title" style={{ width:'40%' }} />
              <div className="skeleton skeleton-text" style={{ width:'60%' }} />
              <div className="skeleton skeleton-text" style={{ width:'35%' }} />
            </div>
          ) : todayRecord ? (
            <div className="already-marked glass-card" style={{ background: STATUS_CONFIG[todayRecord.status]?.bg }}>
              <i className={`fas ${STATUS_CONFIG[todayRecord.status]?.icon}`}
                style={{ fontSize:48, color: STATUS_CONFIG[todayRecord.status]?.color }} />
              <div>
                <h3 style={{ color: STATUS_CONFIG[todayRecord.status]?.color }}>
                  {STATUS_CONFIG[todayRecord.status]?.label}
                </h3>
                <p className="text-muted text-sm">Marked at {todayRecord.time}</p>
                {todayRecord.photoUrl && (
                  <button className="btn btn-ghost btn-sm mt-4"
                    onClick={() => setViewPhoto(todayRecord)}>
                    <i className="fas fa-image" /> View Photo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mark-buttons">
              <button
                className="mark-btn mark-present"
                onClick={() => handleMarkClick('Present')}
                disabled={submitting}
              >
                <div className="mark-btn-icon"><i className="fas fa-check" /></div>
                <span>Mark Present</span>
                <small>Take selfie & mark</small>
              </button>

              <button
                className="mark-btn mark-leave"
                onClick={() => handleMarkClick('Leave')}
                disabled={submitting}
              >
                <div className="mark-btn-icon"><i className="fas fa-calendar-xmark" /></div>
                <span>Apply Leave</span>
                <small>Mark for today</small>
              </button>

              <button
                className="mark-btn mark-off"
                onClick={() => handleMarkClick('Off')}
                disabled={submitting}
              >
                <div className="mark-btn-icon"><i className="fas fa-moon" /></div>
                <span>Mark Off</span>
                <small>Rest day / Off</small>
              </button>
            </div>
          )}

          {submitting && (
            <div className="submitting-overlay">
              <div className="spinner" />
              <p>Saving attendance...</p>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card glass-card">
            <svg className="donut" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--accent-green)" strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * pct / 100)}
                strokeLinecap="round"
                transform="rotate(-90 40 40)" />
            </svg>
            <div className="donut-label">
              <span className="donut-pct">{pct}%</span>
              <span className="text-muted text-xs">Attendance</span>
            </div>
          </div>

          {[
            { label: 'Present', value: stats.present, color: 'var(--accent-green)',  icon: 'fa-check-circle'   },
            { label: 'Leave',   value: stats.leave,   color: 'var(--accent-yellow)', icon: 'fa-calendar-xmark' },
            { label: 'Off',     value: stats.off,     color: 'var(--accent-red)',    icon: 'fa-times-circle'   },
          ].map(s => (
            <div key={s.label} className="stat-mini glass-card">
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize:22 }} />
              <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="history-section">
          {/* Month Navigation */}
          <div className="history-month-nav">
            <button
              className="month-nav-btn"
              title="Previous month"
              onClick={() =>
                loadHistoryForMonth(
                  format(subMonths(new Date(historyMonth + '-02'), 1), 'yyyy-MM')
                )
              }
            >
              <i className="fas fa-chevron-left" />
            </button>
            <h2 className="section-title history-month-label">
              {historyLoading
                ? <span className="text-muted" style={{ fontSize:14 }}>Loading…</span>
                : currentMonthLabel}
            </h2>
            <button
              className="month-nav-btn"
              title="Next month"
              disabled={isCurrentMonth}
              onClick={() => {
                const next = format(addMonths(new Date(historyMonth + '-02'), 1), 'yyyy-MM')
                if (next <= format(new Date(), 'yyyy-MM')) loadHistoryForMonth(next)
              }}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
          <div className="glass-card history-grid">
            {historyLoading ? (
              <div style={{ padding:32, textAlign:'center' }}><div className="spinner" /></div>
            ) : historyData.length === 0 ? (
              <p className="text-muted text-center" style={{ padding:28 }}>
                <i className="fas fa-calendar-xmark" style={{ fontSize:22, marginBottom:8, display:'block' }} />
                No records for {currentMonthLabel}
              </p>
            ) : historyData.map((rec, idx) => {
              const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.Off
              return (
                <div key={rec.id} className="history-item stagger-item"
                  style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div className="history-date">
                    <span className="history-day">{format(parseISO(rec.date), 'dd')}</span>
                    <span className="history-mon">{format(parseISO(rec.date), 'MMM')}</span>
                  </div>
                  <div className="history-info">
                    <span className={`badge badge-${rec.status.toLowerCase()}`}>
                      <i className={`fas ${cfg.icon}`} style={{ fontSize:10 }} />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted">{format(parseISO(rec.date), 'EEE')}</span>
                    <span className="text-xs text-muted">{rec.time || '—'}</span>
                  </div>
                  {rec.photoUrl && (
                    <button className="history-photo" title="View photo"
                      onClick={() => setViewPhoto(rec)}>
                      <i className="fas fa-image" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leave Modal — single instance */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLeaveModal(false)}>
          <div className="modal leave-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-calendar-xmark" style={{ color:'var(--accent-yellow)', marginRight:8 }} />
                Apply Leave
              </h3>
              <button className="modal-close" onClick={() => setShowLeaveModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="leave-modal-body">
              <div className="leave-modal-dates">
                <div className="leave-input-group">
                  <label className="leave-label"><i className="fas fa-calendar-day" /> From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leaveFrom}
                    min={todayStr}
                    onChange={e => {
                      setLeaveFrom(e.target.value)
                      if (leaveTo < e.target.value) setLeaveTo(e.target.value)
                    }}
                  />
                </div>
                <div className="leave-input-group">
                  <label className="leave-label"><i className="fas fa-calendar-check" /> To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leaveTo}
                    min={leaveFrom}
                    onChange={e => setLeaveTo(e.target.value)}
                  />
                </div>
              </div>
              <p className="leave-hint">
                <i className="fas fa-info-circle" /> Select today or any upcoming date.
                If attendance was already marked it will be updated to <strong>Leave</strong>.
                Only <strong>one record per day</strong> is kept.
              </p>
              {upcomingLeaves.length > 0 && (
                <div className="leave-upcoming-preview">
                  <p className="leave-upcoming-label">
                    <i className="fas fa-clock" /> Already applied:
                  </p>
                  <div className="leave-upcoming-chips">
                    {upcomingLeaves.map(lv => (
                      <span key={lv.id} className="leave-chip">
                        {format(new Date(lv.date + 'T00:00:00'), 'dd MMM')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:24 }}>
              <button className="btn btn-ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button className="btn btn-leave-apply" onClick={handleApplyLeave} disabled={applyingLeave}>
                {applyingLeave
                  ? <><div className="spinner spinner-sm" /> Applying…</>
                  : <><i className="fas fa-paper-plane" /> Apply Leave</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewPhoto && (
        <div className="modal-overlay" onClick={() => setViewPhoto(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fas fa-image" /> Attendance Photo</h3>
              <button className="modal-close" onClick={() => setViewPhoto(null)}>×</button>
            </div>
            <img src={viewPhoto.photoUrl} alt="Attendance" className="photo-fade"
              style={{ width:'100%', borderRadius:10, marginBottom:16, maxHeight:320, objectFit:'cover' }} />
            <p><strong>Employee:</strong> {viewPhoto.employeeName || user?.name}</p>
            <p><strong>Date:</strong> {viewPhoto.date}</p>
            <p><strong>Status:</strong> <span className={`badge badge-${viewPhoto.status?.toLowerCase()}`}>{viewPhoto.status}</span></p>
            <p><strong>Time:</strong> {viewPhoto.time}</p>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
