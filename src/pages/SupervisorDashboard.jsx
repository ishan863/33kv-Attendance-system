import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { getAllEmployees, getAllTeams, getAttendanceRange, subscribeToAttendanceRange, subscribeToEmployees } from '../firebase/services'
import { format, eachDayOfInterval, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import './SupervisorDashboard.css'

const STATUS = {
  Present: { short: 'P', class: 'cell-present', badge: 'badge-present' },
  Leave:   { short: 'L', class: 'cell-leave',   badge: 'badge-leave'   },
  Off:     { short: 'O', class: 'cell-off',      badge: 'badge-off'     },
  '':      { short: '—', class: 'cell-none',     badge: 'badge-none'    },
}

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [range, setRange] = useState('week')   // week | month | custom
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewPhoto, setViewPhoto] = useState(null)

  useEffect(() => {
    // Initial load of teams
    getAllTeams().then(setTeams).catch(() => {})
  }, [])

  // Real-time employees
  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToEmployees((emps) => {
      setEmployees(emps.filter(e => e.status === 'active'))
      setLoading(false)
    })
    return unsub
  }, [])

  // Real-time attendance for selected date range
  useEffect(() => {
    if (!startDate || !endDate) return
    const unsub = subscribeToAttendanceRange(startDate, endDate, (recs) => {
      setAttendance(recs)
    })
    return unsub
  }, [startDate, endDate])

  const applyRange = (type) => {
    setRange(type)
    const now = new Date()
    if (type === 'week') {
      setStartDate(format(subDays(now, 6), 'yyyy-MM-dd'))
      setEndDate(format(now, 'yyyy-MM-dd'))
    } else if (type === 'month') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
    }
  }

  // filtered employees
  const filteredEmps = useMemo(() => {
    if (!user) return []
    if (user.role === 'admin') {
      return selectedTeam === 'all' ? employees : employees.filter(e => e.team === selectedTeam)
    }
    // supervisor: only their team
    return employees.filter(e => e.team === user.team)
  }, [employees, selectedTeam, user])

  // Derive unique team names from employees (reliable even if teams collection is empty)
  const teamOptions = useMemo(() => {
    const names = [...new Set(employees.map(e => e.team).filter(Boolean))].sort()
    return names
  }, [employees])

  // date columns
  const dates = useMemo(() => {
    if (!startDate || !endDate) return []
    return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
  }, [startDate, endDate])

  // attendance lookup: { empId+date -> record }
  const attMap = useMemo(() => {
    const map = {}
    attendance.forEach(rec => {
      map[`${rec.employeeId}_${rec.date}`] = rec
    })
    return map
  }, [attendance])

  // summary stats
  const summary = useMemo(() => {
    let present = 0, leave = 0, off = 0, total = 0
    filteredEmps.forEach(emp => {
      dates.forEach(d => {
        const key = `${emp.id}_${format(d, 'yyyy-MM-dd')}`
        const rec = attMap[key]
        if (rec) {
          total++
          if (rec.status === 'Present') present++
          else if (rec.status === 'Leave') leave++
          else if (rec.status === 'Off') off++
        }
      })
    })
    return { present, leave, off, total }
  }, [filteredEmps, dates, attMap])

  if (loading) return (
    <div className="page-container sup-page">
      <div className="mesh-bg" />
      <Navbar />
      <div style={{ paddingTop:100, textAlign:'center' }}><div className="spinner" /></div>
    </div>
  )

  return (
    <div className="page-container sup-page page-enter">
      <div className="mesh-bg" />
      <Navbar />

      <div className="sup-content">
        {/* Page Header */}
        <div className="sup-header">
          <div>
            <h1 className="section-title" style={{ marginBottom:4 }}>
              <span className="text-gradient">Team Attendance</span> Matrix
            </h1>
            <p className="text-muted text-sm">
              { user?.role === 'supervisor' ? `Team: ${user.team}` : 'All Teams — Admin View' }
            </p>
          </div>

          {/* Controls */}
          <div className="sup-controls">
            <div className="range-tabs">
              {['week','month','custom'].map(t => (
                <button
                  key={t}
                  className={`range-tab ${range === t ? 'active' : ''}`}
                  onClick={() => applyRange(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {range === 'custom' && (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="date" className="form-input" style={{ width:150, padding:'8px 12px' }}
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-muted">–</span>
                <input type="date" className="form-input" style={{ width:150, padding:'8px 12px' }}
                  value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}

            {user?.role === 'admin' && (
              <select className="form-select" style={{ width:200, padding:'9px 14px', fontSize:14 }}
                value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
                <option value="all">All Teams</option>
                {teamOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-row">
          {[
            { label:'Total Records', val: summary.total, color:'var(--accent-blue)',   icon:'fa-database' },
            { label:'Present',       val: summary.present, color:'var(--accent-green)', icon:'fa-check-circle' },
            { label:'Leave',         val: summary.leave,   color:'var(--accent-yellow)',icon:'fa-calendar-xmark' },
            { label:'Off / Absent',  val: summary.off,     color:'var(--accent-red)',   icon:'fa-times-circle' },
          ].map(s => (
            <div key={s.label} className="summary-card glass-card">
              <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:22 }} />
              <div className="summary-val" style={{ color:s.color }}>{s.val}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Matrix Table */}
        <div className="glass-card matrix-wrapper">
          <div className="table-wrapper" style={{ borderRadius:'inherit' }}>
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="emp-col"># Employee</th>
                  <th className="emp-col team-col">Team</th>
                  {dates.map(d => (
                    <th key={format(d, 'yyyy-MM-dd')} className={`date-col ${isToday(d) ? 'today-col' : ''}`}>
                      <div>{format(d, 'dd')}</div>
                      <div style={{ fontSize:9 }}>{format(d, 'EEE')}</div>
                    </th>
                  ))}
                  <th className="summary-col">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmps.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 3} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
                      No employees found
                    </td>
                  </tr>
                )}
                {filteredEmps.map((emp, idx) => {
                  let pCnt=0, lCnt=0, oCnt=0
                  const cells = dates.map(d => {
                    const date = format(d, 'yyyy-MM-dd')
                    const rec = attMap[`${emp.id}_${date}`]
                    if (rec?.status === 'Present') pCnt++
                    else if (rec?.status === 'Leave') lCnt++
                    else if (rec?.status === 'Off') oCnt++
                    return { date, rec }
                  })

                  return (
                    <tr key={emp.id}>
                      <td className="emp-col">
                        <div className="emp-cell">
                          <div className="emp-avatar">{emp.name?.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{emp.name}</div>
                            <div className="text-xs text-muted">{emp.designation || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="emp-col team-col">
                        <span style={{ fontSize:12, color:'var(--accent-cyan)' }}>{emp.team || '—'}</span>
                      </td>
                      {cells.map(({ date, rec }) => {
                        const cfg = STATUS[rec?.status || '']
                        return (
                          <td key={date}
                            className={`date-cell ${cfg.class} ${isToday(parseISO(date)) ? 'today-cell':''}`}
                            onClick={() => rec?.photoUrl && setViewPhoto(rec)}
                            title={rec ? `${rec.status} at ${rec.time}` : 'No record'}
                            style={{ cursor: rec?.photoUrl ? 'pointer' : 'default' }}
                          >
                            {cfg.short}
                            {rec?.photoUrl && <i className="fas fa-image photo-dot" />}
                          </td>
                        )
                      })}
                      <td className="summary-col">
                        <div className="row-summary">
                          <span style={{ color:'var(--accent-green)' }}>{pCnt}P</span>
                          <span style={{ color:'var(--accent-yellow)' }}>{lCnt}L</span>
                          <span style={{ color:'var(--accent-red)' }}>{oCnt}O</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="legend glass-card-sm">
          <span style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600 }}>Legend:</span>
          {[
            { short:'P', label:'Present', color:'var(--accent-green)' },
            { short:'L', label:'Leave',   color:'var(--accent-yellow)' },
            { short:'O', label:'Off/Absent', color:'var(--accent-red)' },
            { short:'—', label:'No Record',  color:'var(--text-muted)' },
          ].map(l => (
            <div key={l.short} className="legend-item">
              <span className="legend-badge" style={{ background:`${l.color}22`, color:l.color, border:`1px solid ${l.color}55` }}>
                {l.short}
              </span>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
          <span className="legend-item" style={{ color:'var(--text-muted)', fontSize:11 }}>
            <i className="fas fa-image" /> = Photo available (click to view)
          </span>
        </div>
      </div>

      {/* Photo Popup */}
      {viewPhoto && (
        <div className="modal-overlay" onClick={() => setViewPhoto(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fas fa-image" /> Attendance Photo</h3>
              <button className="modal-close" onClick={() => setViewPhoto(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <img src={viewPhoto.photoUrl} alt="Attendance"
              style={{ width:'100%', borderRadius:12, objectFit:'cover' }} />
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
              <p><strong>Employee:</strong> {viewPhoto.employeeName}</p>
              <p><strong>Date:</strong> {viewPhoto.date}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${viewPhoto.status?.toLowerCase()}`}>{viewPhoto.status}</span></p>
              <p><strong>Time:</strong> {viewPhoto.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth()    === t.getMonth()    &&
         date.getDate()     === t.getDate()
}
