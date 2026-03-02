/**
 * One-time data upload script → uploads all teams + employees to Firestore
 * Run: node upload-data.cjs
 */

const https = require('https')

const PROJECT_ID = 'kv-attendance-4e55c'
const API_KEY    = 'AIzaSyB73MLsmM8nqLISdRWavamx6Mr2ol4QeRo'
const BASE       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// ─── TEAMS ────────────────────────────────────────────────────────────────────
const TEAMS = [
  { id: 'sundargarh-line-team',    name: 'SUNDARGARH LINE/MAINTENENCE/TEAM' },
  { id: 'ujalpur-line-team',       name: 'UJALPUR LINE/MAINTENENCE/TEAM'   },
  { id: 'inside-pss-team',         name: 'INSIDE PSS MAINTENANCE TEAM'     },
  { id: 'testing-team',            name: 'TESTING TEAM'                    },
  { id: 'admin',                   name: 'Admin'                           },
]

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
const EMPLOYEES = [
  // SUNDARGARH LINE/MAINTENENCE/TEAM
  { id:'SCW3127', name:'PRADEEP BARIK',        phone:'7008499080', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Supervisor',               role:'supervisor', status:'active' },
  { id:'SCW3130', name:'DWARIKA PANDA',        phone:'9337562475', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3128', name:'SUMANTA BARIHA',       phone:'7978944676', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3131', name:'HEMSAGAR KISAN',       phone:'9178726495', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3129', name:'BIRENDRA NAIK',        phone:'9337639591', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3134', name:'SALIM TOPPO',          phone:'9078545382', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Helper',                   role:'employee',   status:'active' },
  { id:'SCW3133', name:'BIJAY KUMAR NAIK',     phone:'9178648380', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Helper',                   role:'employee',   status:'active' },
  { id:'SCW3132', name:'THAMAS KUJUR',         phone:'7853043791', team:'SUNDARGARH LINE/MAINTENENCE/TEAM', designation:'Helper',                   role:'employee',   status:'active' },

  // UJALPUR LINE/MAINTENENCE/TEAM
  { id:'SCW3135', name:'KRUSHNA CHANDRA NAIK', phone:'9348641856', team:'UJALPUR LINE/MAINTENENCE/TEAM',    designation:'Supervisor',               role:'supervisor', status:'active' },
  { id:'SCW3139', name:'SANJIT DANSANA',       phone:'9078638839', team:'UJALPUR LINE/MAINTENENCE/TEAM',    designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3137', name:'SUMAN SAMAD',          phone:'7750081861', team:'UJALPUR LINE/MAINTENENCE/TEAM',    designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3136', name:'SUBRATA MUNDA',        phone:'9937081221', team:'UJALPUR LINE/MAINTENENCE/TEAM',    designation:'Lineman',                  role:'employee',   status:'active' },

  // INSIDE PSS MAINTENANCE TEAM
  { id:'SCW3143', name:'SUJIT KUMAR PATEL',    phone:'9178494998', team:'INSIDE PSS MAINTENANCE TEAM',      designation:'Inside PSS Supervisor',    role:'supervisor', status:'active' },
  { id:'SCW3144', name:'ABHIJIT KHARSEL',      phone:'8018709649', team:'INSIDE PSS MAINTENANCE TEAM',      designation:'Lineman',                  role:'employee',   status:'active' },
  { id:'SCW3145', name:'SOHAN LAKRA',          phone:'7855031602', team:'INSIDE PSS MAINTENANCE TEAM',      designation:'Lineman',                  role:'employee',   status:'active' },

  // TESTING TEAM
  { id:'SCW3146', name:'KHETRAMANI NAIK',      phone:'8249738874', team:'TESTING TEAM',                     designation:'Testing Engineer/Supervisor', role:'supervisor', status:'active' },
  { id:'SCW3148', name:'JOGESWAR DHAREI',      phone:'9777737289', team:'TESTING TEAM',                     designation:'Testing Team Helper',      role:'employee',   status:'active' },
  { id:'SGB-230', name:'PRABHAT BIRGANTHIA',   phone:'9337867180', team:'TESTING TEAM',                     designation:'Lineman-Skilled',          role:'employee',   status:'active' },

  // UJALPUR LINE/MAINTENENCE/TEAM (continued)
  { id:'SCW3161', name:'KUSHA MUNDA',          phone:'8018757924', team:'UJALPUR LINE/MAINTENENCE/TEAM',   designation:'Helper-Unskilled',         role:'employee',   status:'active' },
  { id:'SCW3162', name:'SARAT DUNGDUNG',       phone:'8144286307', team:'UJALPUR LINE/MAINTENENCE/TEAM',   designation:'Lineman-Skilled',          role:'employee',   status:'active' },
  { id:'SCW3167', name:'DEBIT KERKETTA',       phone:'9692239310', team:'UJALPUR LINE/MAINTENENCE/TEAM',   designation:'Helper-Unskilled',         role:'employee',   status:'active' },
  { id:'SGB-307', name:'NITIN MAJHI',          phone:'9668159108', team:'UJALPUR LINE/MAINTENENCE/TEAM',   designation:'Helper-Unskilled',         role:'employee',   status:'active' },

  // ADMIN
  { id:'ADM001',  name:'Admin User',           phone:'9876543210', team:'Admin',                            designation:'Administrator',            role:'admin',      status:'active' },
]

// ─── Firestore field formatter ────────────────────────────────────────────────
function toFirestore(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = { stringValue: String(v) }
  }
  return { fields }
}

// ─── HTTP PATCH helper ────────────────────────────────────────────────────────
function patch(path, body) {
  return new Promise((resolve, reject) => {
    const json  = JSON.stringify(body)
    const url   = `${BASE}/${path}?key=${API_KEY}`
    const opts  = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) },
    }
    const req = https.request(url, opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data))
        else reject(new Error(`HTTP ${res.statusCode}: ${data}`))
      })
    })
    req.on('error', reject)
    req.write(json)
    req.end()
  })
}

// ─── Upload teams ─────────────────────────────────────────────────────────────
async function uploadTeams() {
  console.log('\n📁  Uploading teams...')
  for (const t of TEAMS) {
    try {
      await patch(`teams/${t.id}`, toFirestore({ name: t.name, createdAt: new Date().toISOString() }))
      console.log(`  ✅  ${t.name}`)
    } catch (e) {
      console.error(`  ❌  ${t.name}: ${e.message}`)
    }
  }
}

// ─── Upload employees ─────────────────────────────────────────────────────────
async function uploadEmployees() {
  console.log('\n👷  Uploading employees...')
  for (const emp of EMPLOYEES) {
    try {
      await patch(`employees/${emp.id}`, toFirestore(emp))
      console.log(`  ✅  [${emp.id}] ${emp.name} (${emp.role})  📞 ${emp.phone}`)
    } catch (e) {
      console.error(`  ❌  [${emp.id}] ${emp.name}: ${e.message}`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('🚀  33KV Attendance — Firestore Data Upload')
  console.log(`    Project: ${PROJECT_ID}`)
  console.log(`    Teams: ${TEAMS.length}  |  Employees: ${EMPLOYEES.length}`)

  await uploadTeams()
  await uploadEmployees()

  console.log('\n🎉  Done! All data uploaded to Firestore.')
  console.log('    Open http://localhost:5173 and login with any phone number above.')
  console.log(`\n    Admin login phone: 9876543210`)
})()
