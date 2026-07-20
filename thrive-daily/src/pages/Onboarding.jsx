import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="onboarding">
      <div className="onboarding-card">

        <h1>🌱 Welcome to Thrive Daily</h1>

        <p>
          Build better habits, track your growth,
          and become your best self every day.
        </p>

        <div className="feature">
          <h2>✨ Your Growth Journey</h2>
          <p>
            🎯 Set goals<br />
            ✅ Build habits<br />
            ✍️ Reflect through journaling<br />
            😊 Track your mood
          </p>
        </div>

        <div className="feature">
          <h2>🏆 Level Up Your Life</h2>
          <p>
            ⭐ Earn XP<br />
            🔥 Maintain streaks<br />
            🏅 Unlock achievements
          </p>
        </div>

        <button onClick={() => navigate('/register')}>
          Get Started
        </button>

        <button
          className="secondary"
          onClick={() => navigate('/login')}
        >
          I already have an account
        </button>

      </div>
    </div>
  )
}
