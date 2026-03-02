/**
 * Run this script to generate the Employee Import Excel Template:
 *   node generate-template.js
 *
 * The file "Employee_Import_Template.xlsx" will appear in this folder.
 */

const XLSX = require('xlsx')

// ─── Column definitions ──────────────────────────────────────────────────────
const headers = [
  'Employee ID',
  'Name',
  'Phone',
  'Team Name',
  'Designation',
  'Role',
  'Status',
]

// ─── Sample / example rows (delete before uploading) ────────────────────────
const sampleRows = [
  {
    'Employee ID': 'EMP001',
    'Name':        'Rahul Singh',
    'Phone':       '9876543210',
    'Team Name':   'Line Team A',
    'Designation': 'Lineman',
    'Role':        'employee',
    'Status':      'active',
  },
  {
    'Employee ID': 'EMP002',
    'Name':        'Amit Kumar',
    'Phone':       '9123456789',
    'Team Name':   'Line Team A',
    'Designation': 'Helper',
    'Role':        'employee',
    'Status':      'active',
  },
  {
    'Employee ID': 'SUP001',
    'Name':        'Vijay Sharma',
    'Phone':       '9000000001',
    'Team Name':   'Line Team A',
    'Designation': 'Supervisor',
    'Role':        'supervisor',
    'Status':      'active',
  },
  {
    'Employee ID': 'EMP003',
    'Name':        'Suresh Yadav',
    'Phone':       '9900001234',
    'Team Name':   'Line Team B',
    'Designation': 'JE',
    'Role':        'employee',
    'Status':      'active',
  },
  {
    'Employee ID': 'ADM001',
    'Name':        'Admin User',
    'Phone':       '9000000000',
    'Team Name':   'Admin',
    'Designation': 'Administrator',
    'Role':        'admin',
    'Status':      'active',
  },
]

// ─── Instructions sheet data ─────────────────────────────────────────────────
const instructions = [
  ['33KV ATTENDANCE SYSTEM — EMPLOYEE IMPORT TEMPLATE'],
  [''],
  ['COLUMN GUIDE:'],
  ['Column',       'Required?', 'Rules / Allowed Values'],
  ['Employee ID',  'YES',       'Unique ID for each employee (e.g. EMP001, JE-01). No duplicates.'],
  ['Name',         'YES',       'Full name of the employee'],
  ['Phone',        'YES',       '10-digit mobile number — this is used to LOGIN. No spaces or dashes.'],
  ['Team Name',    'YES',       'Must match a team you have created in the Admin Panel'],
  ['Designation',  'NO',        'Lineman / Helper / JE / AE / Supervisor / etc.'],
  ['Role',         'NO',        '"employee"  OR  "supervisor"  OR  "admin"  (default: employee)'],
  ['Status',       'NO',        '"active"  OR  "inactive"  (default: active)'],
  [''],
  ['IMPORTANT NOTES:'],
  ['1.', 'Delete the 4 sample rows before uploading your real data'],
  ['2.', 'Keep Row 1 (headers) exactly as-is — do not rename columns'],
  ['3.', 'Phone number must be exactly 10 digits — this is the LOGIN key'],
  ['4.', 'Employee ID must be unique across all employees'],
  ['5.', 'Role column: use lowercase (employee / supervisor / admin)'],
  ['6.', 'Status column: use lowercase (active / inactive)'],
  ['7.', 'To upload: Admin Panel → Employees tab → Import Excel button'],
  [''],
  ['HOW LOGIN WORKS:'],
  ['→ Employee opens the app and enters their 10-digit phone number'],
  ['→ System checks Firestore database for that phone number'],
  ['→ If found + status is "active" → Login successful'],
  ['→ Role determines which dashboard opens (employee / supervisor / admin)'],
]

// ─── Build workbook ───────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new()

// Sheet 1: Employees data
const ws1 = XLSX.utils.json_to_sheet(sampleRows, { header: headers })

// Style column widths
ws1['!cols'] = [
  { wch: 14 },  // Employee ID
  { wch: 22 },  // Name
  { wch: 14 },  // Phone
  { wch: 20 },  // Team Name
  { wch: 18 },  // Designation
  { wch: 12 },  // Role
  { wch: 12 },  // Status
]

// Sheet 2: Instructions
const ws2 = XLSX.utils.aoa_to_sheet(instructions)
ws2['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 65 }]

XLSX.utils.book_append_sheet(wb, ws1, 'Employees')
XLSX.utils.book_append_sheet(wb, ws2, 'Instructions')

// ─── Write file ───────────────────────────────────────────────────────────────
const filename = 'Employee_Import_Template.xlsx'
XLSX.writeFile(wb, filename)
console.log(`✅  Template created: ${filename}`)
console.log(`    Open it, fill in your employees, then upload via Admin Panel.`)
