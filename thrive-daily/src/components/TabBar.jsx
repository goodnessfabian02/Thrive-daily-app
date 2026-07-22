import { NavLink } from 'react-router-dom'
import { hapticImpact } from '../telegram.js'

const TABS = [
  { to: '/home', icon: '🏡', label: 'Home' },
  { to: '/lessons', icon: '📚', label: 'Lessons' },
  { to: '/journal', icon: '📝', label: 'Journal' },
  { to: '/exercises', icon: '🧘', label: 'Exercises' },
  { to: '/insights', icon: '📊', label: 'Insights' },
  { to: '/profile', icon: '👤', label: 'Profile' }
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          onClick={() => hapticImpact('light')}
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
