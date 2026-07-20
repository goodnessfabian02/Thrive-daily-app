import { getLevelForXp, getNextLevel, getProgressToNextLevel } from '../gamification.js'

export function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

export function LevelSummary({ xp }) {
  const level = getLevelForXp(xp)
  const next = getNextLevel(xp)
  const progress = getProgressToNextLevel(xp)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span className="level-badge">{level.emoji}</span>
        <div>
          <h3 style={{ marginBottom: 2 }}>{level.label}</h3>
          <p className="muted">{xp || 0} XP {next ? `· ${next.minXp - xp} to ${next.label}` : '· Max level'}</p>
        </div>
      </div>
      <ProgressBar value={progress} />
    </div>
  )
}
