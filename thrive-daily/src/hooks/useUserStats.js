import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  db,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp
} from '../firebase.js'
import { computeStreak, computeUnlockedAchievements, todayKey, XP_REWARDS } from '../gamification.js'

const DEFAULT_STATS = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  journalCount: 0,
  exerciseCount: 0,
  achievements: [],
  todayMood: null,
  todayMoodDate: null,
  todayLessonDone: false,
  todayLessonDate: null,
  todayChallengeDone: false,
  todayChallengeDate: null,
  // 'free' | 'monthly' | 'yearly' — defaults to 'free' for all existing users
  subscriptionStatus: 'free'
}

export function useUserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setStats(DEFAULT_STATS)
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setStats({ ...DEFAULT_STATS, ...snap.data() })
      }
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [user])

  const addXp = useCallback(async (amount, activityKey) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const today = todayKey()
    const newStreak = computeStreak(stats.lastActiveDate, stats.streak)
    const newStats = {
      ...stats,
      xp: (stats.xp || 0) + amount,
      streak: newStreak,
      lastActiveDate: today
    }
    if (activityKey === 'journal') newStats.journalCount = (stats.journalCount || 0) + 1
    if (activityKey === 'exercise') newStats.exerciseCount = (stats.exerciseCount || 0) + 1
    if (activityKey === 'lesson') { newStats.todayLessonDone = true; newStats.todayLessonDate = today }
    if (activityKey === 'challenge') { newStats.todayChallengeDone = true; newStats.todayChallengeDate = today }

    const unlocked = computeUnlockedAchievements(newStats)
    newStats.achievements = unlocked

    await updateDoc(ref, {
      xp: newStats.xp,
      streak: newStats.streak,
      lastActiveDate: newStats.lastActiveDate,
      journalCount: newStats.journalCount,
      exerciseCount: newStats.exerciseCount,
      achievements: newStats.achievements,
      ...(activityKey === 'lesson' ? { todayLessonDone: true, todayLessonDate: today } : {}),
      ...(activityKey === 'challenge' ? { todayChallengeDone: true, todayChallengeDate: today } : {})
    })
  }, [user, stats])

  const setMood = useCallback(async (moodKey) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const today = todayKey()
    await updateDoc(ref, { todayMood: moodKey, todayMoodDate: today })
    if (stats.todayMoodDate !== today) {
      await addXp(XP_REWARDS.mood, 'mood')
    }
  }, [user, stats, addXp])

  const completeLesson = useCallback(async () => {
    const today = todayKey()
    if (stats.todayLessonDate === today) return
    await addXp(XP_REWARDS.lesson, 'lesson')
  }, [addXp, stats])

  const completeChallenge = useCallback(async () => {
    const today = todayKey()
    if (stats.todayChallengeDate === today) return
    await addXp(XP_REWARDS.challenge, 'challenge')
  }, [addXp, stats])

  const completeExercise = useCallback(async () => {
    await addXp(XP_REWARDS.exercise, 'exercise')
  }, [addXp])

  const isPremium = stats.subscriptionStatus === 'monthly' || stats.subscriptionStatus === 'yearly'

  return { stats, loading, addXp, setMood, completeLesson, completeChallenge, completeExercise, isPremium }
}
