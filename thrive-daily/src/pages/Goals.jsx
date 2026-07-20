import { useState } from 'react'
import {
  useGoals,
  FREE_GOAL_LIMIT,
  GOAL_CATEGORIES,
  TARGET_TYPES
} from '../hooks/useGoals.js'
import { useUserStats } from '../hooks/useUserStats.js'
import { ProgressBar } from '../components/Progress.jsx'
import PremiumModal from '../components/PremiumModal.jsx'
import Loading from '../components/Loading.jsx'
import { hapticImpact } from '../telegram.js'

export default function Goals() {
  const {
    goals,
    loading,
    error,
    clearError,
    addGoal,
    updateGoal,
    archiveGoal,
    deleteGoal,
    toggleMilestone
  } = useGoals()
  const { addXp, isPremium } = useUserStats()

  const [showForm, setShowForm] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAddClick = () => {
    hapticImpact('light')
    if (!isPremium && goals.length >= FREE_GOAL_LIMIT) {
      setShowPremium(true)
    } else {
      setEditingGoal(null)
      setShowForm(true)
    }
  }

  const handleSave = async (goalData) => {
    setSaving(true)
    const result = editingGoal
      ? await updateGoal(editingGoal.id, goalData)
      : await addGoal(goalData, isPremium)
    setSaving(false)

    if (result.ok) {
      setShowForm(false)
      setEditingGoal(null)
    } else if (result.reason === 'limit_reached') {
      setShowForm(false)
      setShowPremium(true)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Goals</h1>
        <span className="pill">{goals.length}{!isPremium ? `/${FREE_GOAL_LIMIT}` : ''}</span>
      </div>

      {error && (
        <div className="card" onClick={clearError} style={{ borderColor: 'var(--color-danger)' }}>
          <p className="muted">⚠️ {error} (tap to dismiss)</p>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card">
          <p className="muted">No goals yet. What do you want to achieve?</p>
        </div>
      ) : (
        goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onToggleMilestone={(mid) => toggleMilestone(g, mid, addXp)}
            onEdit={() => { setEditingGoal(g); setShowForm(true) }}
            onArchive={() => archiveGoal(g.id)}
            onDelete={() => deleteGoal(g.id)}
          />
        ))
      )}

      <button className="fab" onClick={handleAddClick} aria-label="Add goal">+</button>

      {showForm && (
        <GoalFormSheet
          existingGoal={editingGoal}
          onClose={() => { setShowForm(false); setEditingGoal(null) }}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {showPremium && (
        <PremiumModal featureLabel="unlimited goals" onClose={() => setShowPremium(false)} />
      )}
    </div>
  )
}

function GoalCard({ goal, onToggleMilestone, onEdit, onArchive, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const categoryMeta = GOAL_CATEGORIES.find((c) => c.id === goal.category) || GOAL_CATEGORIES[0]

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <span style={{ fontSize: 22 }}>{categoryMeta.icon}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 2 }}>{goal.title}</h3>
          <p className="muted">{categoryMeta.label} · {goal.progress}%</p>
        </div>
        <span className="muted">{expanded ? '▲' : '▼'}</span>
      </div>

      <div style={{ marginTop: 10 }}>
        <ProgressBar value={(goal.progress || 0) / 100} />
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {goal.milestones && goal.milestones.length > 0 ? (
            goal.milestones.map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <input type="checkbox" checked={m.done} onChange={() => onToggleMilestone(m.id)} />
                <span style={{ textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--color-text-soft)' : 'inherit' }}>
                  {m.text}
                </span>
              </label>
            ))
          ) : (
            <p className="muted">No milestones added.</p>
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={onEdit}>Edit</button>
            <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={onArchive}>Archive</button>
            {confirmDelete ? (
              <>
                <button className="btn-danger" onClick={onDelete}>Confirm</button>
                <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GoalFormSheet({ existingGoal, onClose, onSave, saving }) {
  const [title, setTitle] = useState(existingGoal ? existingGoal.title : '')
  const [category, setCategory] = useState(existingGoal ? existingGoal.category : GOAL_CATEGORIES[0].id)
  const [targetType, setTargetType] = useState(existingGoal ? existingGoal.targetType : 'monthly')
  const [targetDate, setTargetDate] = useState(existingGoal && existingGoal.targetDate ? existingGoal.targetDate : '')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState(existingGoal ? existingGoal.milestones.map((m) => m.text) : [])

  const canSave = title.trim().length > 0 && !saving

  const addMilestone = () => {
    if (milestoneInput.trim()) {
      setMilestones([...milestones, milestoneInput.trim()])
      setMilestoneInput('')
    }
  }

  const removeMilestone = (idx) => setMilestones(milestones.filter((_, i) => i !== idx))

  const handleSave = () => {
    onSave({
      title: title.trim(),
      category,
      targetType,
      targetDate: targetType === 'custom' ? targetDate : null,
      milestones
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{existingGoal ? 'Edit Goal' : 'New Goal'}</h2>

        <span className="field-label">Goal</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Save ₦500,000" maxLength={80} />

        <span className="field-label">Category</span>
        <div>
          {GOAL_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip-selectable${category === c.id ? ' selected' : ''}`} onClick={() => setCategory(c.id)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <span className="field-label">Target</span>
        <div>
          {TARGET_TYPES.map((t) => (
            <button key={t.id} className={`chip-selectable${targetType === t.id ? ' selected' : ''}`} onClick={() => setTargetType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {targetType === 'custom' && (
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        )}

        <span className="field-label">Milestones / Subtasks</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={milestoneInput}
            onChange={(e) => setMilestoneInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
            placeholder="Add a milestone"
          />
          <button className="btn-secondary" style={{ width: 'auto', padding: '13px 16px' }} onClick={addMilestone}>Add</button>
        </div>
        {milestones.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
            {milestones.map((m, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                {m}
                <button className="btn-danger" style={{ padding: '0 0 0 8px' }} onClick={() => removeMilestone(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        <button className="btn-primary" style={{ marginTop: 16 }} disabled={!canSave} onClick={handleSave}>
          {saving ? 'Saving…' : existingGoal ? 'Save Changes' : 'Create Goal'}
        </button>
        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
