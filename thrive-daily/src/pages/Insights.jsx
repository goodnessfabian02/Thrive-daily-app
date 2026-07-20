import { useUserStats } from '../hooks/useUserStats.js'
import { useJournal } from '../hooks/useJournal.js'
import { LevelSummary } from '../components/Progress.jsx'
import { ACHIEVEMENTS } from '../gamification.js'

export default function Insights() {
  const { stats } = useUserStats()
  const { entries } = useJournal()

  const unlocked = new Set(stats.achievements || [])

  return (
    <div>
      <h1 style={{ marginBottom: 14 }}>Insights</h1>

      <div className="card">
        <LevelSummary xp={stats.xp} />
      </div>

      <div className="grid-2">
        <StatCard icon="📝" label="Journal Entries" value={entries.length} />
        <StatCard icon="🧘" label="Exercises Done" value={stats.exerciseCount || 0} />
        <StatCard icon="🔥" label="Current Streak" value={`${stats.streak || 0} days`} />
        <StatCard icon="⭐" label="Total XP" value={stats.xp || 0} />
      </div>

      <div className="card">
        <h2>Achievements</h2>
        {ACHIEVEMENTS.map(a => (
          <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', opacity: unlocked.has(a.key) ? 1 : 0.4 }}>
            <span style={{ fontSize: 24 }}>{a.icon}</span>
            <div>
              <h3 style={{ marginBottom: 2 }}>{a.title}</h3>
              <p className="muted">{a.desc}</p>
            </div>
            {unlocked.has(a.key) && <span style={{ marginLeft: 'auto' }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div className="muted">{label}</div>
    </div>
  )
}
