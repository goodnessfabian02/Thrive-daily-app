import { useState } from 'react'
import { LESSON_CATEGORIES, LESSONS, getLessonOfTheDay } from '../content.js'
import { useUserStats } from '../hooks/useUserStats.js'
import { hapticImpact } from '../telegram.js'

export default function Lessons() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [openLesson, setOpenLesson] = useState(null)
  const { stats, completeLesson } = useUserStats()
  const todayLessonId = getLessonOfTheDay().id
  const today = new Date().toISOString().slice(0, 10)
  const lessonDoneToday = stats.todayLessonDate === today

  const filtered = activeCategory === 'all'
    ? LESSONS
    : LESSONS.filter(l => l.category === activeCategory)

  async function handleOpen(lesson) {
    hapticImpact('light')
    setOpenLesson(lesson)
    if (lesson.id === todayLessonId && !lessonDoneToday) {
      await completeLesson()
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 14 }}>Lessons</h1>

      <div className="chip-row">
        <button
          className={`category-chip${activeCategory === 'all' ? ' active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >All</button>
        {LESSON_CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`category-chip${activeCategory === c.key ? ' active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >{c.icon} {c.label}</button>
        ))}
      </div>

      {openLesson ? (
        <div className="card">
          <button className="muted" onClick={() => setOpenLesson(null)} style={{ marginBottom: 10, fontWeight: 600 }}>← Back to lessons</button>
          <h2>{openLesson.title}</h2>
          <p>{openLesson.body}</p>
          {openLesson.id === todayLessonId && (
            <span className="pill" style={{ marginTop: 12 }}>
              {lessonDoneToday ? '✓ +15 XP earned' : 'Today\'s lesson'}
            </span>
          )}
        </div>
      ) : (
        filtered.map(lesson => {
          const cat = LESSON_CATEGORIES.find(c => c.key === lesson.category)
          return (
            <div key={lesson.id} className="card card-tap" onClick={() => handleOpen(lesson)}>
              <span className="pill" style={{ marginBottom: 8 }}>{cat?.icon} {cat?.label}</span>
              <h3>{lesson.title}</h3>
              <p className="muted">{lesson.body.slice(0, 70)}…</p>
              {lesson.id === todayLessonId && <span className="pill" style={{ marginTop: 8 }}>Today</span>}
            </div>
          )
        })
      )}
    </div>
  )
}
