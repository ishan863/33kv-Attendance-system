import React, { useState } from 'react'

const STEPS = [
  {
    num: 1,
    title: 'Create Firebase Project',
    icon: 'fa-fire',
    color: '#f59e0b',
    steps: [
      'Go to console.firebase.google.com',
      'Click "Add Project" → name it (e.g. 33kv-attendance)',
      'Disable Google Analytics (optional) → Create project',
    ],
  },
  {
    num: 2,
    title: 'Enable Firestore Database',
    icon: 'fa-database',
    color: '#4f8ef7',
    steps: [
      'Left sidebar → Build → Firestore Database',
      'Click "Create database"',
      'Select "Start in test mode" → Next → Enable',
    ],
  },
  {
    num: 3,
    title: 'Enable Firebase Storage',
    icon: 'fa-images',
    color: '#a855f7',
    steps: [
      'Left sidebar → Build → Storage',
      'Click "Get started" → Next → Done',
    ],
  },
  {
    num: 4,
    title: 'Get App Config',
    icon: 'fa-code',
    color: '#00e5ff',
    steps: [
      'Project Settings (gear icon) → General tab',
      'Scroll to "Your apps" → Click </> (Web)',
      'Register app → Copy the firebaseConfig values',
    ],
  },
  {
    num: 5,
    title: 'Create .env File',
    icon: 'fa-file-code',
    color: '#22c55e',
    steps: [
      'In the project folder: 33kv attandance/',
      'Copy .env.example → rename to .env',
      'Paste your Firebase values (see below)',
      'Restart: npm run dev',
    ],
  },
]

const ENV_TEMPLATE = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:123456:web:abcdef`

export default function SetupScreen() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(ENV_TEMPLATE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070718',
      color: '#f1f5f9',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position:'fixed', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,#4f8ef722,transparent 70%)',
        top:-150, left:-150, filter:'blur(60px)', pointerEvents:'none',
      }} />
      <div style={{
        position:'fixed', width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle,#a855f722,transparent 70%)',
        bottom:-100, right:-100, filter:'blur(60px)', pointerEvents:'none',
      }} />

      <div style={{ maxWidth:800, margin:'0 auto', padding:'40px 20px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:72, height:72, borderRadius:20,
            background:'linear-gradient(135deg,#4f8ef7,#00e5ff)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:30,
            boxShadow:'0 8px 30px rgba(79,142,247,0.5)',
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>
            <span style={{ background:'linear-gradient(135deg,#4f8ef7,#00e5ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              33KV Attendance System
            </span>
          </h1>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)',
            borderRadius:99, padding:'6px 18px', marginBottom:12,
          }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', display:'inline-block' }} />
            <span style={{ color:'#f87171', fontSize:13, fontWeight:600 }}>Firebase Not Configured</span>
          </div>
          <p style={{ color:'#94a3b8', fontSize:14 }}>
            Complete these steps to get the app running. Takes about 5 minutes.
          </p>
        </div>

        {/* Steps */}
        {STEPS.map((s, i) => (
          <div key={i} style={{
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:16, padding:'20px 24px', marginBottom:16,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{
                width:40, height:40, borderRadius:12, flexShrink:0,
                background:`${s.color}22`, border:`1px solid ${s.color}44`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, color:s.color,
              }}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div>
                <span style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Step {s.num}
                </span>
                <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>{s.title}</h3>
              </div>
            </div>
            <ul style={{ margin:0, padding:'0 0 0 16px' }}>
              {s.steps.map((st, j) => (
                <li key={j} style={{ color:'#94a3b8', fontSize:13, marginBottom:5, lineHeight:1.5 }}>{st}</li>
              ))}
            </ul>
          </div>
        ))}

        {/* .env template box */}
        <div style={{
          background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,229,255,0.25)',
          borderRadius:16, padding:24, marginBottom:16, position:'relative',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h3 style={{ fontSize:15, fontWeight:700, margin:0, color:'#00e5ff' }}>
              <i className="fas fa-file-code" style={{ marginRight:8 }} />
              .env file contents
            </h3>
            <button onClick={copy} style={{
              padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer',
              background: copied ? '#22c55e' : 'rgba(79,142,247,0.2)',
              color: copied ? 'white' : '#7fb3ff',
              fontSize:12, fontWeight:600, fontFamily:'inherit',
              transition:'all 0.2s',
            }}>
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight:5 }} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre style={{
            margin:0, fontFamily:'monospace', fontSize:13,
            color:'#e2e8f0', lineHeight:1.7, whiteSpace:'pre-wrap',
          }}>{ENV_TEMPLATE}</pre>
        </div>

        {/* Admin note */}
        <div style={{
          background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
          borderRadius:16, padding:20,
        }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fbbf24', marginBottom:10 }}>
            <i className="fas fa-star" style={{ marginRight:8 }} />
            After Setup — Add First Admin in Firestore
          </h3>
          <p style={{ color:'#94a3b8', fontSize:13, margin:'0 0 10px' }}>
            Since login requires a registered phone number, manually add the admin in Firestore:
          </p>
          <div style={{
            background:'rgba(0,0,0,0.3)', borderRadius:10, padding:14,
            fontFamily:'monospace', fontSize:12, color:'#e2e8f0', lineHeight:1.8,
          }}>
            Collection: <span style={{ color:'#00e5ff' }}>employees</span><br />
            Fields:<br />
            &nbsp;&nbsp;name: <span style={{ color:'#4ade80' }}>"Your Name"</span><br />
            &nbsp;&nbsp;phone: <span style={{ color:'#4ade80' }}>"9876543210"</span><br />
            &nbsp;&nbsp;role: <span style={{ color:'#4ade80' }}>"admin"</span><br />
            &nbsp;&nbsp;status: <span style={{ color:'#4ade80' }}>"active"</span><br />
            &nbsp;&nbsp;team: <span style={{ color:'#4ade80' }}>"Admin"</span><br />
            &nbsp;&nbsp;designation: <span style={{ color:'#4ade80' }}>"Administrator"</span>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:30, color:'#475569', fontSize:13 }}>
          After creating the .env file, restart the dev server: <code style={{ color:'#00e5ff' }}>npm run dev</code>
        </div>
      </div>
    </div>
  )
}
