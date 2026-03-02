import { db } from './config'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { format } from 'date-fns'

// Guard helper – throws a clean error if Firebase isn't configured
const requireDb = () => {
  if (!db) throw new Error('Firebase not configured. Create a .env file first.')
  return db
}

// ─── EMPLOYEE SERVICES ─────────────────────────────────────────────────────────

export const loginByPhone = async (phone) => {
  const d = requireDb()
  const q = query(collection(d, 'employees'), where('phone', '==', phone), where('status', '==', 'active'))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export const getAllEmployees = async () => {
  const d = requireDb()
  const snap = await getDocs(collection(d, 'employees'))
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const addEmployee = async (data) => {
  const d = requireDb()
  return await addDoc(collection(d, 'employees'), {
    ...data,
    status: data.status || 'active',
    createdAt: serverTimestamp()
  })
}

export const updateEmployee = async (id, data) => {
  const d = requireDb()
  await updateDoc(doc(d, 'employees', id), data)
}

export const deleteEmployee = async (id) => {
  const d = requireDb()
  await updateDoc(doc(d, 'employees', id), { status: 'inactive' })
}

export const hardDeleteEmployee = async (id) => {
  const d = requireDb()
  await deleteDoc(doc(d, 'employees', id))
}

// ─── TEAM SERVICES ─────────────────────────────────────────────────────────────

export const getAllTeams = async () => {
  const d = requireDb()
  const snap = await getDocs(collection(d, 'teams'))
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const addTeam = async (data) => {
  const d = requireDb()
  return await addDoc(collection(d, 'teams'), { ...data, createdAt: serverTimestamp() })
}

export const updateTeam = async (id, data) => {
  const d = requireDb()
  await updateDoc(doc(d, 'teams', id), data)
}

export const deleteTeam = async (id) => {
  const d = requireDb()
  await deleteDoc(doc(d, 'teams', id))
}

// ─── ATTENDANCE SERVICES ───────────────────────────────────────────────────────

export const getTodayAttendance = async (employeeId) => {
  const d = requireDb()
  const today = format(new Date(), 'yyyy-MM-dd')
  const q = query(
    collection(d, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export const markAttendance = async ({ employeeId, status, photoDataUrl, employeeName, team }) => {
  const d = requireDb()
  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()

  // Compress photo to tiny thumbnail and store in Firestore (no Storage/CORS needed)
  let photoUrl = null
  if (photoDataUrl) {
    try {
      photoUrl = await compressPhoto(photoDataUrl, 160, 160, 0.4)
    } catch { photoUrl = null }
  }

  const data = {
    employeeId,
    employeeName,
    team,
    date: today,
    status,
    photoUrl,
    time: now.toLocaleTimeString('en-IN'),
    timestamp: serverTimestamp(),
    markedBy: 'self'
  }

  const existing = await getTodayAttendance(employeeId)
  if (existing) {
    await updateDoc(doc(d, 'attendance', existing.id), data)
    return existing.id
  } else {
    const r = await addDoc(collection(d, 'attendance'), data)
    return r.id
  }
}

// Compress selfie to ~8KB base64 thumbnail — stored directly in Firestore
function compressPhoto(dataUrl, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export const getAttendanceRange = async (startDate, endDate, teamId = null) => {
  const d = requireDb()
  const q = query(
    collection(d, 'attendance'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  )
  const snap = await getDocs(q)
  let records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  if (teamId) records = records.filter(r => r.team === teamId)
  return records
}

export const getEmployeeAttendanceHistory = async (employeeId, days = 30) => {
  const d = requireDb()
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startDate = format(start, 'yyyy-MM-dd')
  const q = query(
    collection(d, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const updateAttendanceRecord = async (id, data) => {
  const d = requireDb()
  await updateDoc(doc(d, 'attendance', id), data)
}

// Get attendance for a specific month (yyyy-MM)
export const getEmployeeAttendanceByMonth = async (employeeId, yearMonth) => {
  const d = requireDb()
  const [yr, mo] = yearMonth.split('-').map(Number)
  const startDate = `${yearMonth}-01`
  const lastDay  = new Date(yr, mo, 0).getDate()
  const endDate   = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  const q = query(
    collection(d, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Apply leave for multiple dates (today or future)
export const applyLeaveDates = async ({ employeeId, employeeName, team, dates }) => {
  const d = requireDb()
  await Promise.all(dates.map(async (date) => {
    const q = query(
      collection(d, 'attendance'),
      where('employeeId', '==', employeeId),
      where('date', '==', date)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      await updateDoc(doc(d, 'attendance', snap.docs[0].id), { status: 'Leave' })
    } else {
      await addDoc(collection(d, 'attendance'), {
        employeeId,
        employeeName,
        team,
        date,
        status: 'Leave',
        time: '—',
        markedBy: 'leave-request',
        timestamp: serverTimestamp(),
      })
    }
  }))
}

// Get all upcoming (today + future) leave records for an employee
export const getUpcomingLeaves = async (employeeId) => {
  const d = requireDb()
  const today = format(new Date(), 'yyyy-MM-dd')
  const q = query(
    collection(d, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '>=', today),
    orderBy('date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(r => r.status === 'Leave')
}

// ─── REAL-TIME LISTENERS ──────────────────────────────────────────────────────

/**
 * Subscribe to today's attendance record for an employee.
 * Returns unsubscribe function — call it in useEffect cleanup.
 */
export const subscribeToTodayAttendance = (employeeId, callback) => {
  const d = requireDb()
  const today = format(new Date(), 'yyyy-MM-dd')
  const q = query(
    collection(d, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  )
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null)
    } else {
      const docSnap = snap.docs[0]
      callback({ id: docSnap.id, ...docSnap.data() })
    }
  }, () => callback(null))
}

/**
 * Subscribe to attendance records in a date range (used by Supervisor/Admin).
 * Returns unsubscribe function.
 */
export const subscribeToAttendanceRange = (startDate, endDate, callback) => {
  const d = requireDb()
  const q = query(
    collection(d, 'attendance'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }, () => callback([]))
}

/**
 * Subscribe to all active employees.
 * Returns unsubscribe function.
 */
export const subscribeToEmployees = (callback) => {
  const d = requireDb()
  return onSnapshot(collection(d, 'employees'), (snap) => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }, () => callback([]))
}
