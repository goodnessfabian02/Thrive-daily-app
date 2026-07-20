import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  db,
  storage,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
} from '../firebase.js'

export const JOURNAL_MOODS = [
  { id: 'amazing', emoji: '🤩', label: 'Amazing' },
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'calm', emoji: '😌', label: 'Calm' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'stressed', emoji: '😣', label: 'Stressed' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' }
]

export const JOURNAL_CATEGORIES = ['Personal', 'Work', 'Relationships', 'Health', 'Faith', 'Ideas']

// NOTE: no `where('deleted', '==', false)` filter here on purpose — every
// entry created by the original Journal.jsx has no `deleted` field at all,
// and Firestore equality filters exclude docs missing the field entirely.
// We filter deleted entries client-side instead so old entries keep showing.
const DRAFT_STORAGE_KEY = 'td_journal_draft'

export function useJournal() {
  const { user } = useAuth()
  const [rawEntries, setRawEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRawEntries([])
      setLoading(false)
      return
    }
    const q = query(collection(db, 'users', user.uid, 'journal'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('useJournal listener error:', err)
        setError("Couldn't load journal entries. They'll sync when you're back online.")
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  // Filter out soft-deleted entries and pin-sort, client-side (see NOTE above)
  const entries = useMemo(
    () => [...rawEntries].filter((e) => !e.deleted).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [rawEntries]
  )

  const entryRef = useCallback((id) => doc(db, 'users', user.uid, 'journal', id), [user])

  const uploadPhoto = async (file, entryId) => {
    const storageRef = ref(storage, `journalPhotos/${user.uid}/${entryId}/${Date.now()}_${file.name}`)
    const snap = await uploadBytes(storageRef, file)
    return await getDownloadURL(snap.ref)
  }

  // Original signature (text-only) still works: addEntry('some text').
  // New signature: addEntry({ title, contentHtml, mood, gratitude, category, tags }, photoFile)
  const addEntry = useCallback(
    async (entryDataOrText, photoFile) => {
      if (!user) return { ok: false, reason: 'not_signed_in' }
      const isLegacyCall = typeof entryDataOrText === 'string'
      const data = isLegacyCall
        ? { title: '', contentHtml: entryDataOrText.trim(), mood: null, gratitude: '', category: 'Personal', tags: [] }
        : entryDataOrText

      if (!data.contentHtml || !data.contentHtml.replace(/<[^>]*>/g, '').trim()) {
        return { ok: false, reason: 'empty' }
      }

      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'journal'), {
          // `text` kept for backward compatibility with anything reading plain text
          // (e.g. future AI Coach summarization can read this without HTML stripping)
          text: data.contentHtml.replace(/<[^>]*>/g, ''),
          title: data.title || '',
          contentHtml: data.contentHtml,
          mood: data.mood || null,
          gratitude: data.gratitude || '',
          category: data.category || 'Personal',
          tags: data.tags || [],
          pinned: false,
          deleted: false,
          photoUrl: null,
          aiReflection: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        if (photoFile) {
          const url = await uploadPhoto(photoFile, docRef.id)
          await updateDoc(docRef, { photoUrl: url })
        }

        clearDraft()
        return { ok: true, id: docRef.id }
      } catch (err) {
        console.error('addEntry error:', err)
        return { ok: false, reason: 'write_failed' }
      }
    },
    [user]
  )

  const updateEntry = useCallback(
    async (id, updates, photoFile) => {
      try {
        const payload = { ...updates, updatedAt: serverTimestamp() }
        if (updates.contentHtml) payload.text = updates.contentHtml.replace(/<[^>]*>/g, '')
        if (photoFile) payload.photoUrl = await uploadPhoto(photoFile, id)
        await updateDoc(entryRef(id), payload)
        return { ok: true }
      } catch (err) {
        console.error('updateEntry error:', err)
        setError("Couldn't save your edit. Try again.")
        return { ok: false }
      }
    },
    [entryRef]
  )

  // Kept as a hard delete, same as the original implementation — no
  // "trash"/undo requirement was specified, so behavior is unchanged.
  const deleteEntry = useCallback(
    async (entryId) => {
      if (!user) return
      try {
        await deleteDoc(entryRef(entryId))
      } catch (err) {
        console.error('deleteEntry error:', err)
        setError("Couldn't delete entry. Try again.")
      }
    },
    [user, entryRef]
  )

  const togglePin = useCallback(
    async (entry) => {
      setRawEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, pinned: !e.pinned } : e)))
      try {
        await updateDoc(entryRef(entry.id), { pinned: !entry.pinned })
      } catch (err) {
        console.error('togglePin error:', err)
        setRawEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
        setError("Couldn't update pin. Try again.")
      }
    },
    [entryRef]
  )

  const saveDraft = (draft) => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
    } catch (e) {
      /* storage full/unavailable — non-fatal */
    }
  }
  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  }
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch (e) {
      /* non-fatal */
    }
  }

  return {
    entries,
    loading,
    error,
    isOnline,
    clearError: () => setError(null),
    addEntry,
    updateEntry,
    deleteEntry,
    togglePin,
    saveDraft,
    loadDraft,
    clearDraft
  }
}
