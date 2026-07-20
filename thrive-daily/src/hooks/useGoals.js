import { useEffect, useState, useCallback } from 'react'
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
  serverTimestamp
} from '../firebase.js'

export const FREE_GOAL_LIMIT = 3

export const GOAL_CATEGORIES = [
  { id: 'health', label: 'Health', icon: '💪' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'relationships', label: 'Relationships', icon: '❤️' },
  { id: 'spiritual', label: 'Spiritual', icon: '🙏' },
  { id: 'personal', label: 'Personal Development', icon: '🌱' }
]

export const TARGET_TYPES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom date' }
]

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'goals'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('useGoals listener error:', err)
        setError("Couldn't load your goals. Pull down to retry.")
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  const goalRef = useCallback(
    (goalId) => doc(db, 'users', user.uid, 'goals', goalId),
    [user]
  )

  const addGoal = useCallback(
    async (goalData, isPremium) => {
      if (!user) return { ok: false, reason: 'not_signed_in' }
      if (!isPremium && goals.length >= FREE_GOAL_LIMIT) {
        return { ok: false, reason: 'limit_reached' }
      }
      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'goals'), {
          title: goalData.title,
          category: goalData.category,
          targetType: goalData.targetType,
          targetDate: goalData.targetDate || null,
          milestones: goalData.milestones.map((m, i) => ({
            id: `m${i}_${Date.now()}`,
            text: m,
            done: false
          })),
          progress: 0,
          createdAt: serverTimestamp(),
          active: true
        })
        return { ok: true, id: docRef.id }
      } catch (err) {
        console.error('addGoal error:', err)
        return { ok: false, reason: 'write_failed' }
      }
    },
    [user, goals]
  )

  const updateGoal = useCallback(
    async (goalId, updates) => {
      try {
        await updateDoc(goalRef(goalId), updates)
        return { ok: true }
      } catch (err) {
        console.error('updateGoal error:', err)
        setError("Couldn't save changes. Try again.")
        return { ok: false }
      }
    },
    [goalRef]
  )

  const archiveGoal = useCallback(
    async (goalId) => {
      try {
        await updateDoc(goalRef(goalId), { active: false })
      } catch (err) {
        console.error('archiveGoal error:', err)
        setError("Couldn't archive goal. Try again.")
      }
    },
    [goalRef]
  )

  const deleteGoal = useCallback(
    async (goalId) => {
      try {
        await deleteDoc(goalRef(goalId))
      } catch (err) {
        console.error('deleteGoal error:', err)
        setError("Couldn't delete goal. Try again.")
      }
    },
    [goalRef]
  )

  // Optimistic milestone toggle + progress recompute + XP award via
  // the existing useUserStats.addXp, same pattern as habit completion.
  const toggleMilestone = useCallback(
    async (goal, milestoneId, addXp) => {
      const updatedMilestones = goal.milestones.map((m) =>
        m.id === milestoneId ? { ...m, done: !m.done } : m
      )
      const doneCount = updatedMilestones.filter((m) => m.done).length
      const progress = updatedMilestones.length
        ? Math.round((doneCount / updatedMilestones.length) * 100)
        : 0
      const justCompleted = updatedMilestones.find((m) => m.id === milestoneId).done

      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, milestones: updatedMilestones, progress } : g))
      )

      try {
        await updateDoc(goalRef(goal.id), { milestones: updatedMilestones, progress })
        if (justCompleted && typeof addXp === 'function') addXp(15, 'goal')
        if (progress === 100 && typeof addXp === 'function') addXp(50, 'goal')
      } catch (err) {
        console.error('toggleMilestone error:', err)
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)))
        setError("Couldn't save that checkbox. Check your connection.")
      }
    },
    [goalRef]
  )

  return {
    goals,
    loading,
    error,
    clearError: () => setError(null),
    addGoal,
    updateGoal,
    archiveGoal,
    deleteGoal,
    toggleMilestone
  }
}
