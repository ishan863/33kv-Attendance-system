import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const apiKey       = import.meta.env.VITE_FIREBASE_API_KEY
const projectId    = import.meta.env.VITE_FIREBASE_PROJECT_ID

// True only when all required env vars are present
export const firebaseConfigured = !!(apiKey && projectId)

const firebaseConfig = {
  apiKey,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app, db, storage, auth

try {
  app     = initializeApp(firebaseConfig)
  db      = getFirestore(app)
  storage = getStorage(app)
  auth    = getAuth(app)
} catch (e) {
  console.warn('[Firebase] Init failed – check your .env file:', e.message)
}

export { db, storage, auth }
export default app
