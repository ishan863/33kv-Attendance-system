import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight:'100vh', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', background:'#070718',
          color:'#f1f5f9', fontFamily:'Inter,sans-serif', padding:32, textAlign:'center'
        }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚡</div>
          <h2 style={{ fontSize:22, marginBottom:12, color:'#ef4444' }}>App Error</h2>
          <p style={{ color:'#94a3b8', maxWidth:400, marginBottom:20 }}>
            {this.state.error.message}
          </p>
          <p style={{ color:'#64748b', fontSize:13 }}>
            Check your <code style={{ color:'#00e5ff' }}>.env</code> file – see setup instructions below.
          </p>
          <button onClick={() => window.location.reload()}
            style={{ marginTop:24, padding:'10px 24px', borderRadius:10, border:'none',
              background:'#4f8ef7', color:'white', cursor:'pointer', fontSize:14, fontWeight:600 }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
