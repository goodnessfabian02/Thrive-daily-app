import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { hapticNotification } from '../telegram.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      await register(email.trim(), password, name.trim())
      hapticNotification('success')
      navigate('/', { replace: true })
    } catch (err) {
      hapticNotification('error')
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44 }}>🌿</div>
        <h1>Start your journey</h1>
        <p className="muted">Small daily steps toward a better you</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--color-green-dark)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  )
}

function friendlyError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'That email is already registered.'
  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('weak-password')) return 'Please choose a stronger password.'
  return 'Something went wrong. Please try again.'
}
