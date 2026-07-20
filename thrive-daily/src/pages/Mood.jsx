import { useNavigate } from 'react-router-dom'
import { useUserStats } from '../hooks/useUserStats.js'
import { MOODS } from '../content.js'
import { hapticNotification } from '../telegram.js'
import { showBackButton } from '../telegram.js'
import { useEffect } from 'react'

export default function Mood() {
  const { stats, setMood } = useUserStats()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const selected = stats.todayMoodDate === today ? stats.todayMood : null

  useEffect(() => {
    const cleanup = showBackButton(() => navigate(-1))
    return cleanup
  }, [navigate])

  async function pick(moodKey) {
    await setMood(moodKey)
    hapticNotification('success')
    navigate('/')
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Mood Check-in</h1>
      <p className="muted" style={{ marginBottom: 18 }}>How are you really feeling right now?</p>

      <div className="card">
        {MOODS.map(m => (
          <button
            key={m.key}
            onClick={() => pick(m.key)}
            className={`card-tap`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '14px 10px',
              borderRadius: 14,
              marginBottom: 8,
              background: selected === m.key ? 'var(--color-green-light)' : 'var(--color-bg-alt)',
              border: selected === m.key ? '2px solid var(--color-green)' : '2px solid transparent'
            }}
          >
            <span style={{ fontSize: 26 }}>{m.emoji}</span>
            <span style={{ fontWeight: 600 }}>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
