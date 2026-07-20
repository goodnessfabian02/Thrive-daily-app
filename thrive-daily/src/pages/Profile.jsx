import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserStats } from '../hooks/useUserStats.js'
import { LevelSummary } from '../components/Progress.jsx'
import { hapticNotification } from '../telegram.js'

export default function Profile() {
  const { user, logout } = useAuth()
  const { stats } = useUserStats()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    hapticNotification('success')
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <h1 style={{ marginBottom: 14 }}>Profile</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--color-green-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px'
        }}>
          {(user?.displayName || user?.email || '?')[0].toUpperCase()}
        </div>
        <h2>{user?.displayName || 'Thriver'}</h2>
        <p className="muted">{user?.email}</p>
      </div>

      <div className="card">
        <LevelSummary xp={stats.xp} />
      </div>

      <div className="card">
        <Row label="Total XP" value={stats.xp || 0} />
        <Row label="Current Streak" value={`${stats.streak || 0} days`} />
        <Row label="Journal Entries" value={stats.journalCount || 0} />
        <Row label="Exercises Completed" value={stats.exerciseCount || 0} />
      </div>

      <div className="card">
        <button className="btn-danger" onClick={handleLogout} style={{ width: '100%', textAlign: 'center' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
