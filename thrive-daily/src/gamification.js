export const LEVELS = [
  { key: 'seed', label: 'Seed', emoji: '🌱', minXp: 0 },
  { key: 'sprout', label: 'Sprout', emoji: '🌿', minXp: 100 },
  { key: 'bloom', label: 'Bloom', emoji: '🌸', minXp: 300 },
  { key: 'thrive', label: 'Thrive', emoji: '🌳', minXp: 700 },
  { key: 'sage', label: 'Sage', emoji: '🌟', minXp: 1500 }
]

export function getLevelForXp(xp = 0) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl
  }
  return current
}

export function getNextLevel(xp = 0) {
  const current = getLevelForXp(xp)
  const idx = LEVELS.findIndex(l => l.key === current.key)
  return LEVELS[idx + 1] || null
}

export function getProgressToNextLevel(xp = 0) {
  const current = getLevelForXp(xp)
  const next = getNextLevel(xp)
  if (!next) return 1
  const span = next.minXp - current.minXp
  const progressed = xp - current.minXp
  return Math.min(1, Math.max(0, progressed / span))
}

export const XP_REWARDS = {
  lesson: 15,
  exercise: 20,
  journal: 10,
  mood: 5,
  challenge: 25
}

export const ACHIEVEMENTS = [
  { key: 'first_journal', title: 'First Reflection', desc: 'Wrote your first journal entry', icon: '📝', check: s => s.journalCount >= 1 },
  { key: 'streak_3', title: 'Building Momentum', desc: '3 day streak', icon: '🔥', check: s => s.streak >= 3 },
  { key: 'streak_7', title: 'One Week Strong', desc: '7 day streak', icon: '🔥', check: s => s.streak >= 7 },
  { key: 'streak_30', title: 'Rooted', desc: '30 day streak', icon: '🌳', check: s => s.streak >= 30 },
  { key: 'exercises_10', title: 'Practice Makes Progress', desc: '10 exercises completed', icon: '🧘', check: s => s.exerciseCount >= 10 },
  { key: 'level_bloom', title: 'In Bloom', desc: 'Reached Bloom level', icon: '🌸', check: s => getLevelForXp(s.xp).key === 'bloom' || getLevelForXp(s.xp).key === 'thrive' || getLevelForXp(s.xp).key === 'sage' },
  { key: 'level_sage', title: 'The Sage', desc: 'Reached Sage level', icon: '🌟', check: s => getLevelForXp(s.xp).key === 'sage' }
]

export function computeUnlockedAchievements(stats) {
  return ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.key)
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function computeStreak(lastActiveDateKey, currentStreak = 0) {
  const today = todayKey()
  if (lastActiveDateKey === today) return currentStreak
  const yesterday = todayKey(new Date(Date.now() - 86400000))
  if (lastActiveDateKey === yesterday) return currentStreak + 1
  return 1
}
