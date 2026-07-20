import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserStats } from '../hooks/useUserStats.js'
import { useHabits } from '../hooks/useHabits.js'
import { useGoals } from '../hooks/useGoals.js'
import { useJournal, JOURNAL_MOODS } from '../hooks/useJournal.js'
import { LevelSummary } from '../components/Progress.jsx'
import { getLessonOfTheDay } from '../content.js'
import { getChallengeOfTheDay, MOODS } from '../content.js'
import { hapticImpact } from '../telegram.js'

export default function Home() {
  const { user } = useAuth()
  const { stats, loading } = useUserStats()
  const { habits, loading: habitsLoading, isCompletedToday } = useHabits()
  const { goals, loading: goalsLoading } = useGoals()
  const { entries: journalEntries, loading: journalLoading } = useJournal()
  const navigate = useNavigate()

  const lesson = getLessonOfTheDay()
  const challenge = getChallengeOfTheDay()
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'friend')
  const selectedMood = stats.todayMoodDate === todayStr() ? stats.todayMood : null
  const lessonDoneToday = stats.todayLessonDate === todayStr()
  const challengeDoneToday = stats.todayChallengeDate === todayStr()

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <p className="muted">{greeting()}</p>
        <h1>{displayName} 👋</h1>
      </div>

      <div className="card">
        {loading ? <p className="muted">Loading your progress…</p> : <LevelSummary xp={stats.xp} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span className="pill">🔥 {stats.streak || 0} day streak</span>
          <span className="pill">⭐ {stats.xp || 0} XP</span>
        </div>
      </div>

      <div className="card card-tap" onClick={() => navigate('/lessons')}>
        <h2>📚 Today's Lesson</h2>
        <h3>{lesson.title}</h3>
        <p className="muted">{lesson.body.slice(0, 90)}…</p>
        {lessonDoneToday && <span className="pill" style={{ marginTop: 10 }}>✓ Completed today</span>}
      </div>

      <div className="card card-tap" onClick={() => navigate('/exercises')}>
        <h2>🎯 Today's Challenge</h2>
        <p>{challenge}</p>
        {challengeDoneToday && <span className="pill" style={{ marginTop: 10 }}>✓ Completed today</span>}
      </div>

      <div className="card card-tap" onClick={() => navigate('/habits')}>
        <h2>✅ Today's Habits</h2>
        {habitsLoading ? (
          <p className="muted">Loading…</p>
        ) : habits.length === 0 ? (
          <p className="muted">Tap to add your first habit</p>
        ) : (
          <>
            <p className="muted">{habits.filter((h) => isCompletedToday(h.id)).length}/{habits.length} done today</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {habits.slice(0, 5).map((h) => (
                <span key={h.id} className="pill">{isCompletedToday(h.id) ? '✅' : h.icon}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card card-tap" onClick={() => navigate('/goals')}>
        <h2>🎯 Goals</h2>
        {goalsLoading ? (
          <p className="muted">Loading…</p>
        ) : goals.length === 0 ? (
          <p className="muted">Tap to set your first goal</p>
        ) : (
          <>
            <h3 style={{ marginBottom: 4 }}>{goals[0].title}</h3>
            <p className="muted">{goals[0].progress}% complete</p>
          </>
        )}
      </div>

      <div className="card card-tap" onClick={() => navigate('/journal')}>
        <h2>📝 Journal</h2>
        {journalLoading ? (
          <p className="muted">Loading…</p>
        ) : journalEntries.length === 0 ? (
          <p className="muted">Tap to write your first entry</p>
        ) : (
          (() => {
            const latest = journalEntries[0]
            const moodMeta = JOURNAL_MOODS.find((m) => m.id === latest.mood)
            const preview = (latest.text || (latest.contentHtml || '').replace(/<[^>]*>/g, '')).slice(0, 80)
            return (
              <p className="muted">
                {moodMeta ? `${moodMeta.emoji} ` : ''}{preview}{preview.length === 80 ? '…' : ''}
              </p>
            )
          })()
        )}
      </div>

      <div className="card">
        <h2>How are you feeling today?</h2>
        <MoodQuickPicker selected={selectedMood} />
      </div>
    </div>
  )
}

function MoodQuickPicker({ selected }) {
  const navigate = useNavigate()
  return (
    <div className="mood-row">
      {MOODS.map(m => (
        <button
          key={m.key}
          className={`mood-btn${selected === m.key ? ' selected' : ''}`}
          onClick={() => { hapticImpact('light'); navigate('/mood') }}
        >
          <span className="mood-emoji">{m.emoji}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
