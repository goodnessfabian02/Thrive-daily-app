import { initializeApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// NOTE: Replace these with your actual Thrive Daily Firebase project
// credentials (Project settings -> General -> Your apps -> SDK setup).
// Project used elsewhere in this codebase: thrive-daily-555b1
const firebaseConfig = {
  apiKey: "AIzaSyCem-X79HQlBG8iZAFFe6bUOyf2WT4VC-4",
  authDomain: "thrive-daily-8b15d.firebaseapp.com",
  projectId: "thrive-daily-8b15d",
  storageBucket: "thrive-daily-8b15d.firebasestorage.app",
  messagingSenderId: "135942244159",
  appId: "1:135942244159:web:262caf39ace3c7f5d0358a",
  measurementId: "G-GZWFSWYTTH"
};
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(() => {})

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
})

export const storage = getStorage(app)

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  ref,
  uploadBytes,
  getDownloadURL
}

export default app
