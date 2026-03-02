import React, { useRef, useState, useCallback } from 'react'
import './Camera.css'

export default function CameraCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [facingMode, setFacingMode] = useState('user')

  const capture = useCallback(() => {
    if (!webcamRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = webcamRef.current.videoWidth
    canvas.height = webcamRef.current.videoHeight
    canvas.getContext('2d').drawImage(webcamRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setImgSrc(dataUrl)
  }, [])

  const retake = () => setImgSrc(null)

  const confirm = () => {
    if (imgSrc) onCapture(imgSrc)
  }

  const startCamera = async (ref) => {
    if (!ref) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
      })
      ref.srcObject = stream
      await ref.play()
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (webcamRef.current?.srcObject) {
      webcamRef.current.srcObject.getTracks().forEach(t => t.stop())
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && (stopCamera(), onClose())}>
      <div className="modal camera-modal">
        <div className="modal-header">
          <h3 className="modal-title"><i className="fas fa-camera" /> Take Selfie</h3>
          <button className="modal-close" onClick={() => { stopCamera(); onClose() }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="camera-preview">
          {!imgSrc ? (
            <>
              <video
                ref={(el) => { webcamRef.current = el; startCamera(el) }}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <div className="camera-overlay-ring" />
              <div className="camera-face-guide">
                <div className="face-circle" />
              </div>
            </>
          ) : (
            <img src={imgSrc} alt="Captured" className="camera-video" />
          )}
        </div>

        <div className="camera-controls">
          {!imgSrc ? (
            <button className="btn btn-primary capture-btn" onClick={capture}>
              <i className="fas fa-circle" /> Capture
            </button>
          ) : (
            <div style={{ display:'flex', gap:12 }}>
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
          <i className="fas fa-info-circle" /> Position your face inside the circle
        </p>
      </div>
    </div>
  )
}
