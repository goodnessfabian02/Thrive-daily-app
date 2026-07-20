import thriveLogo from '../assets/IMG_4137.jpeg'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const screens = [
    {
      icon: "🌱",
      title: "Welcome to Thrive Daily",
      text: "Build better habits, track your growth, and become your best self every day."
    },
    {
      icon: "🎯",
      title: "Your Growth Journey",
      text: "Set goals, build habits, reflect through journaling, and track your mood."
    },
    {
      icon: "🏆",
      title: "Level Up Your Life",
      text: "Earn XP, maintain streaks, and unlock achievements as you grow."
    }
  ]

  const current = screens[page]

  return (
    <div className="onboarding">
      <div className="onboarding-card">

        <div className="onboarding-icon">
  <img src={thriveLogo} alt="Thrive Daily" />
</div>

        <h1>{current.title}</h1>

        <p>
          {current.text}
        </p>

        <div className="onboarding-features">

          {page === 0 && (
            <>
              <div className="onboarding-feature">
                🌿 Personal growth
              </div>
              <div className="onboarding-feature">
                📈 Track your progress
              </div>
            </>
          )}

          {page === 1 && (
            <>
              <div className="onboarding-feature">
                🎯 Goals
              </div>
              <div className="onboarding-feature">
                ✅ Habits
              </div>
              <div className="onboarding-feature">
                ✍️ Journal
              </div>
              <div className="onboarding-feature">
                😊 Mood tracking
              </div>
            </>
          )}

          {page === 2 && (
            <>
              <div className="onboarding-feature">
                ⭐ Earn XP
              </div>
              <div className="onboarding-feature">
                🔥 Build streaks
              </div>
              <div className="onboarding-feature">
                🏅 Unlock achievements
              </div>
            </>
          )}

        </div>


        <div className="onboarding-dots">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`onboarding-dot ${page === index ? 'active' : ''}`}
            />
          ))}
        </div>


        {page < 2 ? (
          <button
            className="btn-primary"
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
        )}


        <button
          className="btn-secondary"
          onClick={() => navigate('/login')}
        >
          I already have an account
        </button>

      </div>
    </div>
  )
  }
