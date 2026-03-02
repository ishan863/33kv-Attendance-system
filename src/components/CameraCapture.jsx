import React, { useRef, useState, useEffect, useCallback } from 'react'
import './Camera.css'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)          // track active MediaStream separately
  const [imgSrc,      setImgSrc]      = useState(null)
  const [facingMode,  setFacingMode]  = useState('user')
  const [camError,    setCamError]    = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  /* ── stop any running stream ── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  /* ── start (or restart) camera ── */
  const startCamera = useCallback(async () => {
    stopCamera()
    setCamError(false)
    if (!videoRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 960 } }
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    } catch (err) {
      console.error('Camera error:', err)
      setCamError(true)
    }
  }, [facingMode, stopCamera])

  /* ── start camera when showing live view; restart when facingMode changes ── */
  useEffect(() => {
    if (!imgSrc) startCamera()
  }, [imgSrc, facingMode])     // eslint-disable-line react-hooks/exhaustive-deps

  /* ── always stop camera on unmount ── */
  useEffect(() => () => stopCamera(), [stopCamera])

  /* ── capture snapshot then stop live feed immediately ── */
  const capture = useCallback(() => {
    const vid = videoRef.current
    if (!vid || vid.readyState < 2) return
    const canvas = document.createElement('canvas')
    canvas.width  = vid.videoWidth
    canvas.height = vid.videoHeight
    canvas.getContext('2d').drawImage(vid, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)

    // flash effect
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 250)

    stopCamera()          // ← turn off camera right after capturing
    setImgSrc(dataUrl)
  }, [stopCamera])

  /* ── retake: clear image → useEffect restarts camera ── */
  const retake = useCallback(() => setImgSrc(null), [])

  /* ── flip front / back ── */
  const flipCamera = useCallback(() => {
    stopCamera()
    setFacingMode(m => (m === 'user' ? 'environment' : 'user'))
  }, [stopCamera])

  const confirm = useCallback(() => {
    if (imgSrc) { stopCamera(); onCapture(imgSrc) }
  }, [imgSrc, onCapture, stopCamera])

  const handleClose = useCallback(() => { stopCamera(); onClose() }, [stopCamera, onClose])

  return (
    <div
      className="modal-overlay camera-overlay"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal camera-modal">
        <div className="modal-header">
          <h3 className="modal-title"><i className="fas fa-camera" /> Take Selfie</h3>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="camera-preview">
          {flashActive && <div className="camera-flash" />}

          {!imgSrc ? (
            <>
              {camError ? (
                <div className="camera-error">
                  <i className="fas fa-exclamation-triangle" />
                  <p>Camera access denied or unavailable.<br />Please allow camera permission and retry.</p>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={startCamera}>
                    <i className="fas fa-redo" /> Retry
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
              )}
              <div className="camera-overlay-ring" />
              <div className="camera-face-guide">
                <div className="face-circle" />
              </div>
              <button className="flip-btn" onClick={flipCamera} title="Flip camera">
                <i className="fas fa-sync-alt" />
              </button>
            </>
          ) : (
            <>
              <img src={imgSrc} alt="Captured" className="camera-video" />
              <div className="captured-check">
                <i className="fas fa-check-circle" />
              </div>
            </>
          )}
        </div>

        <div className="camera-controls">
          {!imgSrc ? (
            <button
              className="btn btn-primary capture-btn"
              onClick={capture}
              disabled={camError}
            >
              <i className="fas fa-circle" /> Capture
            </button>
          ) : (
            <div className="captured-actions">
              <button className="btn btn-ghost" onClick={retake}>
                <i className="fas fa-redo" /> Retake
              </button>
              <button className="btn btn-success" onClick={confirm}>
                <i className="fas fa-check" /> Use Photo
              </button>
            </div>
          )}
        </div>

        <p className="camera-hint text-muted text-sm text-center mt-4">
          {!imgSrc
            ? <><i className="fas fa-info-circle" /> Position your face inside the oval</>
            : <><i className="fas fa-check-circle" style={{ color:'var(--accent-green)' }} /> Photo captured — tap Use Photo to confirm</>
          }
        </p>
      </div>
    </div>
  )
}

