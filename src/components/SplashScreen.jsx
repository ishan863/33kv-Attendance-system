import React, { useEffect, useState, useCallback } from 'react'
import './SplashScreen.css'

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  const finish = useCallback(() => {
    setFadeOut(true)
    setTimeout(onDone, 600)
  }, [onDone])

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      // Accelerate early, slow near end for realism
      const step = current < 70 ? Math.random() * 10 + 4
                 : current < 90 ? Math.random() * 4 + 1
                 : Math.random() * 1.5 + 0.5
      current = Math.min(current + step, 100)
      setProgress(Math.round(current))
      if (current >= 100) {
        clearInterval(interval)
        setTimeout(finish, 400)
      }
    }, 90)
    return () => clearInterval(interval)
  }, [finish])

  const radius = 72
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress / 100)

  return (
    <div className={`splash-screen${fadeOut ? ' splash-fadeout' : ''}`}>
      {/* Background layers */}
      <div className="splash-bg-glow splash-glow-1" />
      <div className="splash-bg-glow splash-glow-2" />
      <div className="splash-grid" />

      <div className="splash-content">

        {/* Circular progress ring */}
        <div className="splash-ring-wrap">
          {/* Outer orbit rings */}
          <div className="splash-orbit splash-orbit-1" />
          <div className="splash-orbit splash-orbit-2" />
          <div className="splash-orbit splash-orbit-3" />

          {/* SVG progress circle */}
          <svg className="splash-svg" viewBox="0 0 180 180" width="180" height="180">
            <defs>
              <linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#4f8ef7" />
              </linearGradient>
              <filter id="pgGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="90" cy="90" r={radius}
              fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="3" />
            {/* Progress arc */}
            <circle cx="90" cy="90" r={radius}
              fill="none"
              stroke="url(#pgGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#pgGlow)"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.08s linear',
              }}
            />
            {/* Dots on ring */}
            {[0,60,120,180,240,300].map((deg, i) => {
              const rad = (deg - 90) * Math.PI / 180
              const cx = 90 + radius * Math.cos(rad)
              const cy = 90 + radius * Math.sin(rad)
              return <circle key={i} cx={cx} cy={cy} r="2.5" fill="rgba(0,229,255,0.4)" />
            })}
          </svg>

          {/* Center content */}
          <div className="splash-center">
            <div className="splash-bolt-bg" />
            <i className="fas fa-bolt splash-bolt-icon" />
            <div className="splash-pct">{progress}%</div>
            <div className="splash-loading-lbl">LOADING</div>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="splash-brand">33kV Team</h1>

        {/* Subtitle with typing dots */}
        <p className="splash-subtitle">Powering Attendance System</p>

        {/* Animated dots */}
        <div className="splash-dots">
          <span className="sdot" />
          <span className="sdot" />
          <span className="sdot" />
        </div>

        {/* Creator */}
        <div className="splash-creator">
          Created by <span>Raja Patel</span>
        </div>
      </div>
    </div>
  )
}
