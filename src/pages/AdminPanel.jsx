import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  getAllEmployees, addEmployee, updateEmployee, hardDeleteEmployee,
  getAllTeams, addTeam, updateTeam, deleteTeam,
  getAttendanceRange, updateAttendanceRecord,
  subscribeToAttendanceRange, subscribeToEmployees
} from '../firebase/services'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import './AdminPanel.css'

const ROLES = ['employee', 'supervisor', 'admin']
const STATUSES = ['Present', 'Leave', 'Off']

const EMPTY_EMP = { name:'', phone:'', team:'', designation:'', role:'employee', status:'active' }
const EMPTY_TEAM = { teamName:'', supervisorName:'' }

export default function AdminPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState('employees')  // employees | teams | attendance
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewPhoto, setViewPhoto] = useState(null)

  // Employee modal
  const [empModal, setEmpModal] = useState(false)
  const [empForm, setEmpForm] = useState(EMPTY_EMP)
  const [editEmpId, setEditEmpId] = useState(null)
  const [empSaving, setEmpSaving] = useState(false)

  // Team modal
  const [teamModal, setTeamModal] = useState(false)
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM)
  const [editTeamId, setEditTeamId] = useState(null)

  // Attendance filters
  const [attStart, setAttStart] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [attEnd, setAttEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attSearch, setAttSearch] = useState('')
  const [datePreset, setDatePreset] = useState('week')

  // Search
  const [empSearch, setEmpSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const importFileRef = React.useRef(null)

  useEffect(() => {
    // Real-time employee list
    const unsub = subscribeToEmployees((emps) => {
      setEmployees(emps)
      setLoading(false)
    })
    getAllTeams().then(setTeams).catch(() => {})
    return unsub
  }, [])

  const loadAll = async () => {
    try {
      const [emps, tms] = await Promise.all([getAllEmployees(), getAllTeams()])
      setEmployees(emps)
      setTeams(tms)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const fetchAttendance = async () => {
    try {
      const recs = await getAttendanceRange(attStart, attEnd)
      setAttendance(recs)
    } catch { toast.error('Failed to load attendance') }
  }

  // Real-time attendance for selected range when on attendance tab
  useEffect(() => {
    if (tab !== 'attendance') return
    const unsub = subscribeToAttendanceRange(attStart, attEnd, (recs) => {
      setAttendance(recs)
    })
    return unsub
  }, [tab, attStart, attEnd])

  // ── EMPLOYEE CRUD ──────────────────────────────────────────────────────────
  const openAddEmp = () => { setEmpForm(EMPTY_EMP); setEditEmpId(null); setEmpModal(true) }
  const openEditEmp = (emp) => {
    setEmpForm({
      name:        emp.name        || '',
      phone:       emp.phone       || '',
      team:        emp.team        || '',
      designation: emp.designation || '',
      role:        emp.role        || 'employee',
      status:      emp.status      || 'active',
    })
    setEditEmpId(emp.id)
    setEmpModal(true)
  }

  const saveEmployee = async (e) => {
    e.preventDefault()
    if (!empForm.name || !empForm.phone) { toast.error('Name and phone required'); return }
    setEmpSaving(true)
    try {
      if (editEmpId) {
        await updateEmployee(editEmpId, empForm)
        toast.success('Employee updated!')
      } else {
        await addEmployee(empForm)
        toast.success('Employee added!')
      }
      setEmpModal(false)
      loadAll()
    } catch { toast.error('Save failed') }
    finally { setEmpSaving(false) }
  }

  const handleDeleteEmp = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return
    try {
      await hardDeleteEmployee(id)
      toast.success('Employee deleted')
      loadAll()
    } catch { toast.error('Delete failed') }
  }

  const handleDeactivate = async (id, current) => {
    try {
      await updateEmployee(id, { status: current === 'active' ? 'inactive' : 'active' })
      toast.success('Status updated')
      loadAll()
    } catch { toast.error('Update failed') }
  }

  // ── TEAM CRUD ──────────────────────────────────────────────────────────────
  const openAddTeam = () => { setTeamForm(EMPTY_TEAM); setEditTeamId(null); setTeamModal(true) }
  const openEditTeam = (t) => { setTeamForm({ ...t }); setEditTeamId(t.id); setTeamModal(true) }

  const saveTeam = async (e) => {
    e.preventDefault()
    if (!teamForm.teamName) { toast.error('Team name required'); return }
    try {
      if (editTeamId) {
        await updateTeam(editTeamId, teamForm)
        toast.success('Team updated!')
      } else {
        await addTeam(teamForm)
        toast.success('Team created!')
      }
      setTeamModal(false)
      loadAll()
    } catch { toast.error('Save failed') }
  }

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete team "${name}"?`)) return
    try {
      await deleteTeam(id)
      toast.success('Team deleted')
      loadAll()
    } catch { toast.error('Delete failed') }
  }

  // ── QUICK DATE PRESETS ────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    const today = new Date()
    setDatePreset(preset)
    if (preset === 'week') {
      setAttStart(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setAttEnd(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    } else if (preset === 'month') {
      setAttStart(format(startOfMonth(today), 'yyyy-MM-dd'))
      setAttEnd(format(endOfMonth(today), 'yyyy-MM-dd'))
    } else if (preset === 'lastmonth') {
      const lm = subMonths(today, 1)
      setAttStart(format(startOfMonth(lm), 'yyyy-MM-dd'))
      setAttEnd(format(endOfMonth(lm), 'yyyy-MM-dd'))
    }
  }

  // ── EXPORT ATTENDANCE SHEET (fully formatted with ExcelJS) ─────────────────
  const exportAttendanceSheet = async () => {
    if (!attendance.length) { toast.error('No attendance data for selected range'); return }

    const dates = []
    let cur = new Date(attStart + 'T00:00:00')
    const endD = new Date(attEnd + 'T00:00:00')
    while (cur <= endD) { dates.push(format(cur, 'yyyy-MM-dd')); cur = new Date(cur); cur.setDate(cur.getDate() + 1) }

    const attMap = {}
    attendance.forEach(rec => {
      if (!attMap[rec.employeeId]) attMap[rec.employeeId] = {}
      attMap[rec.employeeId][rec.date] = rec.status
    })

    const STATUS_CODE = { Present: 'P', Leave: 'L', Off: 'O' }
    const startLabel  = format(new Date(attStart + 'T00:00:00'), 'dd-MM-yyyy')
    const endLabel    = format(new Date(attEnd   + 'T00:00:00'), 'dd-MM-yyyy')
    const periodLabel = attStart === attEnd ? startLabel : `${startLabel} TO ${endLabel}`

    const teamMap = {}
    employees.filter(e => e.status === 'active').forEach(emp => {
      const t = emp.team || 'Unassigned'
      if (!teamMap[t]) teamMap[t] = []
      teamMap[t].push(emp)
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'SANDHA GLOBAL IT'

    // ── Style helpers ────────────────────────────────────────────────────────
    const thin   = { style: 'thin',   color: { argb: 'FF999999' } }
    const medium = { style: 'medium', color: { argb: 'FF000000' } }
    const bdr    = { top: thin, left: thin, bottom: thin, right: thin }
    const bdrMed = { top: medium, left: medium, bottom: medium, right: medium }

    const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
    const font = (opts) => ({ name: 'Calibri', ...opts })

    const applyCell = (cell, opts = {}) => {
      if (opts.fill)      cell.fill      = opts.fill
      if (opts.font)      cell.font      = font(opts.font)
      if (opts.alignment) cell.alignment = opts.alignment
      if (opts.border !== false) cell.border = opts.border || bdr
      if (opts.value !== undefined) cell.value = opts.value
    }

    Object.entries(teamMap).forEach(([teamName, teamEmps]) => {
      teamEmps.sort((a, b) => {
        if (a.role === 'supervisor' && b.role !== 'supervisor') return -1
        if (b.role === 'supervisor' && a.role !== 'supervisor') return 1
        return a.name.localeCompare(b.name)
      })

      const totalCols = 3 + dates.length + 2   // +2 for NOS OF DAYS + PRESENT DAYS
      const sheetName = teamName.replace(/[\/\\*\[\]:?]/g, '-').substring(0, 31)
      const ws = wb.addWorksheet(sheetName, {
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, paperSize: 9 }
      })

      // ── Row 1: Company header ──────────────────────────────────────────────
      ws.addRow(['SANDHA GLOBAL INFORMATION TECHNOLOGY pvt ltd'])
      ws.mergeCells(1, 1, 1, totalCols)
      applyCell(ws.getCell(1,1), {
        value: 'SANDHA GLOBAL INFORMATION TECHNOLOGY pvt ltd',
        fill:  fill('FF1F4E79'),
        font:  { bold: true, size: 15, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: bdrMed,
      })
      ws.getRow(1).height = 26

      // ── Row 2: Sheet title ─────────────────────────────────────────────────
      ws.addRow([`ATTENDANCE SHEET FOR THE PERIOD OF ${periodLabel} (${teamName})`])
      ws.mergeCells(2, 1, 2, totalCols)
      applyCell(ws.getCell(2,1), {
        value: `ATTENDANCE SHEET FOR THE PERIOD OF ${periodLabel} (${teamName})`,
        fill:  fill('FF2E75B6'),
        font:  { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: bdrMed,
      })
      ws.getRow(2).height = 22

      // ── Row 3: Column headers ──────────────────────────────────────────────
      const hdrValues = [
        'SL\nNO', 'NAME', 'DESIGNATION',
        ...dates.map(d => format(new Date(d + 'T00:00:00'), 'dd-MM-yy')),
        'NOS OF\nDAYS', 'PRESENT\nDAYS',
      ]
      const hdrRow = ws.addRow(hdrValues)
      hdrRow.height = 32
      hdrRow.eachCell({ includeEmpty: true }, (cell) => {
        applyCell(cell, {
          fill:      fill('FF1F3864'),
          font:      { bold: true, size: 9, color: { argb: 'FFFFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          border:    bdrMed,
        })
      })

      // ── Data rows ──────────────────────────────────────────────────────────
      teamEmps.forEach((emp, idx) => {
        const presentCount = dates.filter(d => attMap[emp.id]?.[d] === 'Present').length
        const rowVals = [
          idx + 1,
          emp.name,
          (emp.designation || emp.role || '').toUpperCase(),
          ...dates.map(d => STATUS_CODE[attMap[emp.id]?.[d]] || ''),
          presentCount,
          presentCount,
        ]
        const row = ws.addRow(rowVals)
        row.height = 18
        const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F9FF'

        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          const val = cell.value
          const isDateCol = colNum >= 4 && colNum <= 3 + dates.length

          if (val === 'P') {
            applyCell(cell, {
              fill: fill('FFC6EFCE'),
              font: { bold: true, size: 10, color: { argb: 'FF375623' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            })
          } else if (val === 'L') {
            applyCell(cell, {
              fill: fill('FFFFEB9C'),
              font: { bold: true, size: 10, color: { argb: 'FF7D5A00' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            })
          } else if (val === 'O' || val === '') {
            applyCell(cell, {
              fill: val === 'O' ? fill('FFFFC7CE') : fill(isDateCol ? 'FFEFEFEF' : rowBg),
              font: { bold: val === 'O', size: 10, color: { argb: val === 'O' ? 'FF9C0006' : 'FF888888' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            })
          } else if (colNum === totalCols - 1 || colNum === totalCols) {
            // NOS OF DAYS + PRESENT DAYS columns
            applyCell(cell, {
              fill: fill('FFE2EFDA'),
              font: { bold: true, size: 11, color: { argb: 'FF1F4E79' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
              border: bdrMed,
            })
          } else if (colNum === 1) {
            applyCell(cell, { fill: fill(rowBg), font: { size: 9, color: { argb: 'FF666666' } }, alignment: { horizontal: 'center', vertical: 'middle' } })
          } else if (colNum === 2) {
            applyCell(cell, { fill: fill(rowBg), font: { bold: true, size: 10, color: { argb: 'FF1F3864' } }, alignment: { horizontal: 'left', vertical: 'middle', indent: 1 } })
          } else {
            applyCell(cell, { fill: fill(rowBg), font: { size: 9, color: { argb: 'FF444444' } }, alignment: { horizontal: 'center', vertical: 'middle' } })
          }
        })
      })

      // ── Column widths ──────────────────────────────────────────────────────
      ws.getColumn(1).width = 5.5
      ws.getColumn(2).width = 24
      ws.getColumn(3).width = 22
      for (let i = 4; i <= 3 + dates.length; i++) ws.getColumn(i).width = 10
      ws.getColumn(3 + dates.length + 1).width = 10
      ws.getColumn(3 + dates.length + 2).width = 10

      // ── Freeze panes (SL, NAME, DESIG fixed while scrolling dates) ─────────
      ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 3, topLeftCell: 'D4' }]

      // ── Legend ─────────────────────────────────────────────────────────────
      ws.addRow([])
      const lgRow = ws.addRow(['LEGEND :', 'P = Present', 'L = Leave / Holiday', 'O = Off / Absent', '', '', ''])
      lgRow.height = 16
      lgRow.getCell(1).font = font({ italic: true, bold: true, size: 8, color: { argb: 'FF333333' } })
      lgRow.getCell(2).fill = fill('FFC6EFCE'); lgRow.getCell(2).font = font({ bold: true, size: 8, color: { argb: 'FF375623' } })
      lgRow.getCell(3).fill = fill('FFFFEB9C'); lgRow.getCell(3).font = font({ bold: true, size: 8, color: { argb: 'FF7D5A00' } })
      lgRow.getCell(4).fill = fill('FFFFC7CE'); lgRow.getCell(4).font = font({ bold: true, size: 8, color: { argb: 'FF9C0006' } })
    })

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `Attendance_${attStart}_to_${attEnd}.xlsx`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`✅ Exported ${Object.keys(teamMap).length} team sheet(s)!`)
  }

  // ── DOWNLOAD EMPLOYEE TEMPLATE ─────────────────────────────────────────────
  const downloadTemplate = () => {
    const templateData = [
      {
        'Name':        'Rahul Singh',
        'Phone':       '9876543210',
        'Team':        'Line Team A',
        'Designation': 'Lineman',
        'Role':        'employee',
        'Status':      'active',
      },
      {
        'Name':        'Amit Kumar',
        'Phone':       '9123456789',
        'Team':        'Line Team A',
        'Designation': 'Helper',
        'Role':        'employee',
        'Status':      'active',
      },
      {
        'Name':        'Supervisor Name',
        'Phone':       '9000000001',
        'Team':        'Line Team A',
        'Designation': 'Supervisor',
        'Role':        'supervisor',
        'Status':      'active',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    // Column widths
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }
    ]
    // Notes sheet with instructions
    const notes = XLSX.utils.aoa_to_sheet([
      ['INSTRUCTIONS'],
      [''],
      ['Column', 'Required?', 'Allowed Values'],
      ['Name',        'YES',  'Full name of employee'],
      ['Phone',       'YES',  '10-digit mobile number (no spaces)'],
      ['Team',        'NO',   'Team name — must match a team you created'],
      ['Designation', 'NO',   'Lineman / Helper / JE / AE / etc.'],
      ['Role',        'NO',   'employee  OR  supervisor  OR  admin'],
      ['Status',      'NO',   'active  OR  inactive  (default: active)'],
      [''],
      ['NOTES:'],
      ['- Delete the sample rows before uploading'],
      ['- Keep row 1 as headers exactly as shown'],
      ['- Phone must be unique per employee'],
      ['- Role defaults to employee if blank'],
    ])
    notes['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 48 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employees')
    XLSX.utils.book_append_sheet(wb, notes, 'Instructions')
    XLSX.writeFile(wb, 'Employee_Import_Template.xlsx')
    toast.success('Template downloaded!')
  }

  // ── IMPORT FROM EXCEL ──────────────────────────────────────────────────────
  const handleImportFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)
      if (!rows.length) { toast.error('No data found in Excel file'); return }

      let added = 0, skipped = 0, errors = []
      for (const row of rows) {
        const name  = String(row['Name']  || '').trim()
        const phone = String(row['Phone'] || '').replace(/\D/g, '').trim()
        if (!name || phone.length < 10) { skipped++; continue }
        try {
          await addEmployee({
            name,
            phone,
            team:        String(row['Team']        || '').trim(),
            designation: String(row['Designation'] || '').trim(),
            role:        (String(row['Role']   || 'employee').trim().toLowerCase()),
            status:      (String(row['Status'] || 'active').trim().toLowerCase()),
          })
          added++
        } catch (err) {
          errors.push(name)
        }
      }
      await loadAll()
      if (added > 0) toast.success(`${added} employee(s) imported successfully!`)
      if (skipped > 0) toast(`${skipped} row(s) skipped (missing name/phone)`, { icon: '⚠️' })
      if (errors.length > 0) toast.error(`${errors.length} failed to import`)
    } catch (err) {
      toast.error('Failed to read file. Use the provided template.')
    } finally {
      setImporting(false)
    }
  }

  // ── FILTERS ────────────────────────────────────────────────────────────────
  const filteredEmps = useMemo(() =>
    employees.filter(e =>
      e.name?.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.phone?.includes(empSearch) ||
      e.team?.toLowerCase().includes(empSearch.toLowerCase())
    ), [employees, empSearch])

  const filteredAtt = useMemo(() =>
    attendance.filter(r =>
      r.employeeName?.toLowerCase().includes(attSearch.toLowerCase()) ||
      r.employeeId?.includes(attSearch) ||
      r.team?.toLowerCase().includes(attSearch.toLowerCase())
    ), [attendance, attSearch])

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    supervisors: employees.filter(e => e.role === 'supervisor').length,
    teams: teams.length,
  }

  return (
    <div className="page-container admin-page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="admin-content">
        {/* Stats */}
        <div className="admin-stats">
          {[
            { label:'Total Employees', val:stats.total,       color:'var(--accent-blue)',   icon:'fa-users' },
            { label:'Active',          val:stats.active,      color:'var(--accent-green)',  icon:'fa-circle-check' },
            { label:'Supervisors',     val:stats.supervisors, color:'var(--accent-purple)', icon:'fa-user-tie' },
            { label:'Teams',           val:stats.teams,       color:'var(--accent-cyan)',   icon:'fa-people-group' },
          ].map(s => (
            <div key={s.label} className="admin-stat glass-card">
              <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:24 }} />
              <div className="admin-stat-val" style={{ color:s.color }}>{s.val}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs glass-card-sm">
          {[
            { key:'employees', icon:'fa-users',        label:'Employees' },
            { key:'teams',     icon:'fa-people-group', label:'Teams' },
            { key:'attendance',icon:'fa-calendar-days',label:'Attendance' },
          ].map(t => (
            <button key={t.key} className={`admin-tab ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── EMPLOYEES TAB ── */}
        {tab === 'employees' && (
          <div className="tab-panel">
            {/* Import Excel banner */}
            <div className="import-banner glass-card-sm">
              <div className="import-banner-text">
                <i className="fas fa-file-excel" style={{ color:'#22c55e', fontSize:20 }} />
                <div>
                  <span style={{ fontWeight:600, fontSize:14 }}>Bulk Import Employees</span>
                  <span className="text-muted text-sm" style={{ marginLeft:8 }}>
                    Download the template, fill employee data, then upload
                  </span>
                </div>
              </div>
              <div className="import-banner-actions">
                <button className="btn btn-success btn-sm" onClick={downloadTemplate}>
                  <i className="fas fa-download" /> Download Template
                </button>
                <button className="btn btn-primary btn-sm" disabled={importing}
                  onClick={() => importFileRef.current?.click()}>
                  {importing
                    ? <><div className="spinner spinner-sm" /> Importing...</>
                    : <><i className="fas fa-upload" /> Import Excel</>}
                </button>
                <input ref={importFileRef} type="file" accept=".xlsx,.xls"
                  style={{ display:'none' }} onChange={handleImportFile} />
              </div>
            </div>

            <div className="tab-header">
              <div className="flex gap-3 items-center">
                <div className="search-box">
                  <i className="fas fa-search search-icon" />
                  <input className="form-input with-icon" placeholder="Search employees..."
                    value={empSearch} onChange={e => setEmpSearch(e.target.value)} />
                </div>
                <span className="text-muted text-sm">
                  {filteredEmps.length} of {employees.length} employees
                </span>
              </div>
              <button className="btn btn-primary" onClick={openAddEmp}>
                <i className="fas fa-plus" /> Add Employee
              </button>
            </div>

            <div className="glass-card table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Phone</th><th>Team</th>
                    <th>Designation</th><th>Role</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmps.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
                      {loading ? 'Loading...' : 'No employees found'}
                    </td></tr>
                  )}
                  {filteredEmps.map((emp, i) => (
                    <tr key={emp.id}>
                      <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="emp-avatar-sm">{emp.name?.charAt(0)}</div>
                          <span style={{ fontWeight:600 }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily:'monospace' }}>{emp.phone}</td>
                      <td><span style={{ color:'var(--accent-cyan)', fontSize:13 }}>{emp.team || '—'}</span></td>
                      <td>{emp.designation || '—'}</td>
                      <td><span className={`role-badge role-${emp.role}`}>{emp.role}</span></td>
                      <td>
                        <span className={`badge ${emp.status==='active'?'badge-present':'badge-off'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditEmp(emp)} title="Edit">
                            <i className="fas fa-edit" />
                          </button>
                          <button
                            className={`btn btn-sm ${emp.status==='active'?'btn-warning':'btn-success'}`}
                            onClick={() => handleDeactivate(emp.id, emp.status)}
                            title={emp.status==='active'?'Deactivate':'Activate'}
                          >
                            <i className={`fas ${emp.status==='active'?'fa-ban':'fa-check'}`} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEmp(emp.id, emp.name)} title="Delete">
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TEAMS TAB ── */}
        {tab === 'teams' && (
          <div className="tab-panel">
            <div className="tab-header">
              <h3 style={{ fontWeight:700 }}>Manage Teams ({teams.length})</h3>
              <button className="btn btn-primary" onClick={openAddTeam}>
                <i className="fas fa-plus" /> Add Team
              </button>
            </div>

            <div className="teams-grid">
              {teams.map(t => {
                const memberCount = employees.filter(e => e.team === t.teamName && e.status==='active').length
                return (
                  <div key={t.id} className="team-card glass-card">
                    <div className="team-icon"><i className="fas fa-people-group" /></div>
                    <h3 className="team-name">{t.teamName}</h3>
                    <p className="text-muted text-sm">
                      <i className="fas fa-user-tie" /> {t.supervisorName || 'No Supervisor'}
                    </p>
                    <div className="team-count">
                      <i className="fas fa-users" /> {memberCount} members
                    </div>
                    <div className="team-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditTeam(t)}>
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTeam(t.id, t.teamName)}>
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </div>
                  </div>
                )
              })}
              {teams.length === 0 && (
                <div style={{ padding:32, color:'var(--text-muted)', textAlign:'center', gridColumn:'1/-1' }}>
                  No teams yet. Click Add Team to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {tab === 'attendance' && (
          <div className="tab-panel">
            <div className="tab-header flex-wrap" style={{ flexDirection:'column', alignItems:'stretch', gap:12 }}>
              {/* Quick preset buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key:'week',      label:'This Week' },
                  { key:'month',     label:'This Month' },
                  { key:'lastmonth', label:'Last Month' },
                  { key:'custom',    label:'Custom' },
                ].map(p => (
                  <button key={p.key}
                    className={`btn btn-sm ${datePreset===p.key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => applyPreset(p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Date inputs + search + export */}
              <div className="flex gap-3 items-center flex-wrap" style={{ justifyContent:'space-between' }}>
                <div className="flex gap-3 items-center flex-wrap">
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="date" className="form-input" style={{ width:155, padding:'8px 12px' }}
                      value={attStart} onChange={e => { setAttStart(e.target.value); setDatePreset('custom') }} />
                    <span className="text-muted">–</span>
                    <input type="date" className="form-input" style={{ width:155, padding:'8px 12px' }}
                      value={attEnd} onChange={e => { setAttEnd(e.target.value); setDatePreset('custom') }} />
                  </div>
                  <div className="search-box">
                    <i className="fas fa-search search-icon" />
                    <input className="form-input with-icon" placeholder="Search name / team..."
                      value={attSearch} onChange={e => setAttSearch(e.target.value)} style={{ width:200 }} />
                  </div>
                </div>
                <button className="btn btn-success" onClick={exportAttendanceSheet}>
                  <i className="fas fa-file-excel" /> Export Attendance Sheet
                </button>
              </div>
            </div>

            <div className="glass-card table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Team</th><th>Date</th>
                    <th>Status</th><th>Time</th><th>Photo</th><th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtt.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
                      No records found for selected range
                    </td></tr>
                  )}
                  {filteredAtt.map(rec => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight:600 }}>{rec.employeeName}</td>
                      <td style={{ color:'var(--accent-cyan)' }}>{rec.team || '—'}</td>
                      <td style={{ fontFamily:'monospace' }}>{rec.date}</td>
                      <td><span className={`badge badge-${rec.status?.toLowerCase()}`}>{rec.status}</span></td>
                      <td style={{ fontFamily:'monospace', fontSize:12 }}>{rec.time || '—'}</td>
                      <td>
                        {rec.photoUrl ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewPhoto(rec)}>
                            <i className="fas fa-image" />
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding:'5px 8px', fontSize:12, width:100 }}
                          value={rec.status}
                          onChange={async (e) => {
                            const newVal = e.target.value
                            try {
                              await updateAttendanceRecord(rec.id, { status: newVal })
                              toast.success('Status updated!')
                              await fetchAttendance()
                            } catch {
                              toast.error('Failed to update status')
                            }
                          }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      {empModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setEmpModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className={`fas ${editEmpId?'fa-edit':'fa-user-plus'}`} />
                {editEmpId ? ' Edit Employee' : ' Add Employee'}
              </h3>
              <button className="modal-close" onClick={() => setEmpModal(false)}><i className="fas fa-times" /></button>
            </div>

            <form onSubmit={saveEmployee}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={empForm.name}
                    onChange={e => setEmpForm({...empForm, name:e.target.value})} placeholder="Rahul Singh" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input className="form-input" value={empForm.phone} type="tel" maxLength={10}
                    onChange={e => setEmpForm({...empForm, phone:e.target.value})} placeholder="9876543210" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <select className="form-select" value={empForm.team}
                    onChange={e => setEmpForm({...empForm, team:e.target.value})}>
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.teamName}>{t.teamName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={empForm.designation}
                    onChange={e => setEmpForm({...empForm, designation:e.target.value})} placeholder="Lineman, Helper..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={empForm.role}
                    onChange={e => setEmpForm({...empForm, role:e.target.value})}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={empForm.status}
                    onChange={e => setEmpForm({...empForm, status:e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={empSaving}>
                  {empSaving ? <><div className="spinner spinner-sm" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {teamModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setTeamModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className={`fas ${editTeamId?'fa-edit':'fa-plus'}`} />
                {editTeamId ? ' Edit Team' : ' Add Team'}
              </h3>
              <button className="modal-close" onClick={() => setTeamModal(false)}><i className="fas fa-times" /></button>
            </div>

            <form onSubmit={saveTeam}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input className="form-input" value={teamForm.teamName}
                  onChange={e => setTeamForm({...teamForm, teamName:e.target.value})} placeholder="Line Team A" required />
              </div>
              <div className="form-group">
                <label className="form-label">Supervisor Name</label>
                <select className="form-select" value={teamForm.supervisorName}
                  onChange={e => setTeamForm({...teamForm, supervisorName:e.target.value})}>
                  <option value="">Select Supervisor</option>
                  {employees.filter(e=>e.role==='supervisor'&&e.status==='active').map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="fas fa-save" /> Save</button>
              </div>
            </form>
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
            <p><strong>Employee:</strong> {viewPhoto.employeeName}</p>
            <p><strong>Date:</strong> {viewPhoto.date}</p>
            <p><strong>Status:</strong> <span className={`badge badge-${viewPhoto.status?.toLowerCase()}`}>{viewPhoto.status}</span></p>
            <p><strong>Time:</strong> {viewPhoto.time}</p>
          </div>
        </div>
      )}
    </div>
  )
}
