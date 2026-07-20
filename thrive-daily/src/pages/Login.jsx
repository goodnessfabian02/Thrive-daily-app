import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { hapticNotification } from '../telegram.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
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
        <div style={{ fontSize: 44 }}>🌱</div>
        <h1>Welcome back</h1>
        <p className="muted">Log in to continue your growth journey</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
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
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
        New here? <Link to="/register" style={{ color: 'var(--color-green-dark)', fontWeight: 600 }}>Create an account</Link>
      </p>
    </div>
  )
}

function friendlyError(err) {
  const code = err?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.'
  }
  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again shortly.'
  return 'Something went wrong. Please try again.'
}
