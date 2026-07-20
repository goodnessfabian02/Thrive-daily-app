import { useState } from 'react'
import { useHabits, FREE_HABIT_LIMIT, HABIT_ICONS } from '../hooks/useHabits.js'
import { useUserStats } from '../hooks/useUserStats.js'
import PremiumModal from '../components/PremiumModal.jsx'
import Loading from '../components/Loading.jsx'
import { hapticImpact, hapticNotification } from '../telegram.js'

const CATEGORIES = [
  { id: 'health', label: 'Health' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'finance', label: 'Finance' },
  { id: 'learning', label: 'Learning' }
]

export default function Habits() {
  const {
    habits,
    loading,
    error,
    clearError,
    isCompletedToday,
    calcStreak,
    addHabit,
    archiveHabit,
    toggleToday
  } = useHabits()
  const { addXp, isPremium } = useUserStats()

  const [showAdd, setShowAdd] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAddClick = () => {
    hapticImpact('light')
    if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
      setShowPremium(true)
    } else {
      setShowAdd(true)
    }
  }

  const handleToggle = async (habit) => {
    hapticImpact('medium')
    await toggleToday(habit, addXp)
    if (!isCompletedToday(habit.id)) hapticNotification('success')
  }

  const handleSave = async (data) => {
    setSaving(true)
    const result = await addHabit(data, isPremium)
    setSaving(false)
    if (result.ok) {
      setShowAdd(false)
    } else if (result.reason === 'limit_reached') {
      setShowAdd(false)
      setShowPremium(true)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Habits</h1>
        <span className="pill">{habits.length}{!isPremium ? `/${FREE_HABIT_LIMIT}` : ''}</span>
      </div>

      {error && (
        <div className="card" onClick={clearError} style={{ borderColor: 'var(--color-danger)' }}>
          <p className="muted">⚠️ {error} (tap to dismiss)</p>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="card">
          <p className="muted">No habits yet. Start with something small — like drinking more water.</p>
        </div>
      ) : (
        habits.map((h) => (
          <div key={h.id} className="habit-row">
            <button className="habit-check" onClick={() => handleToggle(h)}>
              {isCompletedToday(h.id) ? '✅' : h.icon}
            </button>
            <div className="habit-info">
              <div className="habit-name">{h.name}</div>
              {calcStreak(h.id) > 0 && (
                <div className="habit-streak">🔥 {calcStreak(h.id)} day{calcStreak(h.id) === 1 ? '' : 's'}</div>
              )}
            </div>
            <button className="btn-danger" onClick={() => archiveHabit(h.id)}>Remove</button>
          </div>
        ))
      )}

      <button className="fab" onClick={handleAddClick} aria-label="Add habit">+</button>

      {showAdd && (
        <AddHabitSheet onClose={() => setShowAdd(false)} onSave={handleSave} saving={saving} />
      )}
      {showPremium && (
        <PremiumModal featureLabel="unlimited habits" onClose={() => setShowPremium(false)} />
      )}
    </div>
  )
}

function AddHabitSheet({ onClose, onSave, saving }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(HABIT_ICONS[0])
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [frequency, setFrequency] = useState('daily')

  const canSave = name.trim().length > 0 && !saving

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>New Habit</h2>

        <span className="field-label">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drink water"
          maxLength={40}
        />

        <span className="field-label">Icon</span>
        <div className="icon-grid">
          {HABIT_ICONS.map((ic) => (
            <button
              key={ic}
              className={`icon-choice${icon === ic ? ' selected' : ''}`}
              onClick={() => setIcon(ic)}
            >
              {ic}
            </button>
          ))}
        </div>

        <span className="field-label">Category</span>
        <div>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip-selectable${category === c.id ? ' selected' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <span className="field-label">Frequency</span>
        <div>
          {['daily', 'weekly'].map((f) => (
            <button
              key={f}
              className={`chip-selectable${frequency === f ? ' selected' : ''}`}
              onClick={() => setFrequency(f)}
            >
              {f === 'daily' ? 'Every day' : 'Weekly'}
            </button>
          ))}
        </div>

        <button className="btn-primary" style={{ marginTop: 16 }} disabled={!canSave} onClick={() => onSave({ name: name.trim(), icon, category, frequency })}>
          {saving ? 'Saving…' : 'Create Habit'}
        </button>
        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
