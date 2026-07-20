import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from '../firebase.js'

export const FREE_HABIT_LIMIT = 3

export const HABIT_ICONS = ['💧', '🏃', '📖', '🧘', '💰', '🌅', '🥗', '😴', '🙏', '✍️', '🚭', '💪']

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// Walk backward day-by-day through a completions map ({ 'YYYY-MM-DD': true })
// to compute the current streak, starting from today.
function calcStreakFromMap(completionDates) {
  let streak = 0
  const cursor = new Date()
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (completionDates.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({}) // { "habitId_YYYY-MM-DD": { id, habitId, date } }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'habits'),
      where('active', '==', true),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHabits(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('useHabits habits listener error:', err)
        setError("Couldn't load your habits. Pull down to retry.")
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) {
      setCompletions({})
      return
    }
    const since = new Date()
    since.setDate(since.getDate() - 35)
    const sinceKey = since.toISOString().slice(0, 10)

    const q = query(
      collection(db, 'users', user.uid, 'habitCompletions'),
      where('date', '>=', sinceKey)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => {
          const data = d.data()
          map[`${data.habitId}_${data.date}`] = { id: d.id, ...data }
        })
        setCompletions(map)
      },
      (err) => {
        console.error('useHabits completions listener error:', err)
        setError("Couldn't sync habit history.")
      }
    )
    return unsub
  }, [user])

  const completionDatesByHabit = useMemo(() => {
    const byHabit = {}
    Object.values(completions).forEach((c) => {
      if (!byHabit[c.habitId]) byHabit[c.habitId] = new Set()
      byHabit[c.habitId].add(c.date)
    })
    return byHabit
  }, [completions])

  const isCompletedToday = useCallback(
    (habitId) => !!completions[`${habitId}_${todayKey()}`],
    [completions]
  )

  const calcStreak = useCallback(
    (habitId) => calcStreakFromMap(completionDatesByHabit[habitId] || new Set()),
    [completionDatesByHabit]
  )

  const addHabit = useCallback(
    async (habitData, isPremium) => {
      if (!user) return { ok: false, reason: 'not_signed_in' }
      if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
        return { ok: false, reason: 'limit_reached' }
      }
      try {
        await addDoc(collection(db, 'users', user.uid, 'habits'), {
          name: habitData.name,
          icon: habitData.icon,
          category: habitData.category,
          frequency: habitData.frequency,
          createdAt: serverTimestamp(),
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
          active: true
        })
        return { ok: true }
      } catch (err) {
        console.error('addHabit error:', err)
        return { ok: false, reason: 'write_failed' }
      }
    },
    [user, habits]
  )

  const archiveHabit = useCallback(
    async (habitId) => {
      if (!user) return
      try {
        await updateDoc(doc(db, 'users', user.uid, 'habits', habitId), { active: false })
      } catch (err) {
        console.error('archiveHabit error:', err)
        setError("Couldn't remove habit. Try again.")
      }
    },
    [user]
  )

  const deleteHabit = useCallback(
    async (habitId) => {
      if (!user) return
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'habits', habitId))
      } catch (err) {
        console.error('deleteHabit error:', err)
        setError("Couldn't delete habit. Try again.")
      }
    },
    [user]
  )

  // Optimistic local toggle, then background Firestore write — same
  // local-first pattern as useUserStats.addXp / the rest of the app.
  const toggleToday = useCallback(
    async (habit, addXp) => {
      if (!user) return
      const dKey = todayKey()
      const mapKey = `${habit.id}_${dKey}`
      const alreadyDone = !!completions[mapKey]

      setCompletions((prev) => {
        const next = { ...prev }
        if (alreadyDone) delete next[mapKey]
        else next[mapKey] = { habitId: habit.id, date: dKey, pending: true }
        return next
      })

      const habitRef = doc(db, 'users', user.uid, 'habits', habit.id)
      const completionsCol = collection(db, 'users', user.uid, 'habitCompletions')

      try {
        if (alreadyDone) {
          const existing = completions[mapKey]
          if (existing && existing.id) {
            await deleteDoc(doc(db, 'users', user.uid, 'habitCompletions', existing.id))
          }
          await updateDoc(habitRef, {
            currentStreak: Math.max(0, (habit.currentStreak || 1) - 1)
          })
        } else {
          await addDoc(completionsCol, {
            habitId: habit.id,
            date: dKey,
            completedAt: serverTimestamp()
          })
          const newStreak = calcStreak(habit.id) + 1
          await updateDoc(habitRef, {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, habit.longestStreak || 0),
            totalCompletions: increment(1)
          })
          if (typeof addXp === 'function') addXp(10, 'habit')
        }
      } catch (err) {
        console.error('toggleToday error:', err)
        setCompletions((prev) => {
          const next = { ...prev }
          if (alreadyDone) next[mapKey] = { habitId: habit.id, date: dKey }
          else delete next[mapKey]
          return next
        })
        setError("Couldn't save that. Check your connection and try again.")
      }
    },
    [user, completions, calcStreak]
  )

  return {
    habits,
    loading,
    error,
    clearError: () => setError(null),
    isCompletedToday,
    calcStreak,
    addHabit,
    archiveHabit,
    deleteHabit,
    toggleToday
  }
}
