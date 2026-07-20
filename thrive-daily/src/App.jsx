import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Loading from './components/Loading.jsx'
import TabBar from './components/TabBar.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Home from './pages/Home.jsx'
import Mood from './pages/Mood.jsx'
import Lessons from './pages/Lessons.jsx'
import Journal from './pages/Journal.jsx'
import Habits from './pages/Habits.jsx'
import Goals from './pages/Goals.jsx'
import Exercises from './pages/Exercises.jsx'
import Insights from './pages/Insights.jsx'
import Profile from './pages/Profile.jsx'
import Onboarding from './pages/Onboarding.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to="/" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      {children}
      <TabBar />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />

      <Route path="/" element={<RequireAuth><AppLayout><Home /></AppLayout></RequireAuth>} />
      <Route path="/mood" element={<RequireAuth><div className="app-shell"><Mood /></div></RequireAuth>} />
      <Route path="/lessons" element={<RequireAuth><AppLayout><Lessons /></AppLayout></RequireAuth>} />
      <Route path="/journal" element={<RequireAuth><AppLayout><Journal /></AppLayout></RequireAuth>} />
      <Route path="/habits" element={<RequireAuth><AppLayout><Habits /></AppLayout></RequireAuth>} />
      <Route path="/goals" element={<RequireAuth><AppLayout><Goals /></AppLayout></RequireAuth>} />
      <Route path="/exercises" element={<RequireAuth><AppLayout><Exercises /></AppLayout></RequireAuth>} />
      <Route path="/insights" element={<RequireAuth><AppLayout><Insights /></AppLayout></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><AppLayout><Profile /></AppLayout></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
