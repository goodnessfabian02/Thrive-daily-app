import { useNavigate } from 'react-router-dom'

// Generic upgrade prompt shown whenever a free-tier limit is hit
// (habits, goals, etc). `featureLabel` customizes the copy.
export default function PremiumModal({ featureLabel = 'this feature', onClose }) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    onClose()
    navigate('/profile') // profile page hosts the subscription/upgrade flow
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-center" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">✨</div>
        <h2>Unlock {featureLabel}</h2>
        <p className="muted">
          You've reached the free plan limit. Go Premium for unlimited habits, goals,
          AI coaching, and more.
        </p>
        <button className="btn-primary" onClick={handleUpgrade}>Upgrade to Premium</button>
        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>Maybe Later</button>
      </div>
    </div>
  )
}
