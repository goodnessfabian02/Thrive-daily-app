import { useState, useEffect, useRef } from 'react'
import { EXERCISES } from '../content.js'
import { useUserStats } from '../hooks/useUserStats.js'
import { useJournal } from '../hooks/useJournal.js'
import { hapticNotification, hapticImpact } from '../telegram.js'

export default function Exercises() {
  const [active, setActive] = useState(null)
  const { completeExercise } = useUserStats()

  async function handleDone() {
    await completeExercise()
    hapticNotification('success')
    setActive(null)
  }

  if (active) {
    return <ExerciseRunner exercise={active} onDone={handleDone} onCancel={() => setActive(null)} />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 14 }}>Exercises</h1>
      {EXERCISES.map(ex => (
        <div key={ex.id} className="card card-tap" onClick={() => { hapticImpact('light'); setActive(ex) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{ex.icon}</span>
            <div>
              <h3>{ex.title}</h3>
              <p className="muted">{ex.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExerciseRunner({ exercise, onDone, onCancel }) {
  if (exercise.type === 'breathing') return <BreathingExercise exercise={exercise} onDone={onDone} onCancel={onCancel} />
  if (exercise.type === 'gratitude') return <TextExercise exercise={exercise} onDone={onDone} onCancel={onCancel} placeholder="I'm grateful for..." />
  if (exercise.type === 'goal') return <TextExercise exercise={exercise} onDone={onDone} onCancel={onCancel} placeholder="My goal this week is..." />
  return null
}

function BreathingExercise({ exercise, onDone, onCancel }) {
  const phases = ['Inhale', 'Hold', 'Exhale', 'Hold']
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(4)
  const [round, setRound] = useState(1)
  const totalRounds = 4

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setPhaseIndex(p => {
            const next = (p + 1) % 4
            if (next === 0) setRound(r => r + 1)
            return next
          })
          return 4
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const finished = round > totalRounds

  return (
    <div className="card" style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
      <button className="muted" onClick={onCancel} style={{ float: 'left', fontWeight: 600 }}>← Cancel</button>
      <h2 style={{ marginTop: 30 }}>{exercise.title}</h2>
      {!finished ? (
        <>
          <div style={{ fontSize: 48, margin: '30px 0 10px' }}>{phases[phaseIndex] === 'Inhale' ? '🫁' : phases[phaseIndex] === 'Exhale' ? '💨' : '⏸️'}</div>
          <h1>{phases[phaseIndex]}</h1>
          <p className="muted">{secondsLeft}s · Round {round} of {totalRounds}</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, margin: '30px 0 10px' }}>✅</div>
          <h2>Well done</h2>
          <p className="muted" style={{ marginBottom: 20 }}>You completed the breathing exercise.</p>
          <button className="btn-primary" onClick={onDone}>Finish (+20 XP)</button>
        </>
      )}
    </div>
  )
}

function TextExercise({ exercise, onDone, onCancel, placeholder }) {
  const [text, setText] = useState('')
  const { addEntry } = useJournal()

  async function handleSubmit() {
    if (text.trim()) {
      await addEntry(`[${exercise.title}] ${text.trim()}`)
    }
    onDone()
  }

  return (
    <div className="card">
      <button className="muted" onClick={onCancel} style={{ marginBottom: 10, fontWeight: 600 }}>← Cancel</button>
      <h2>{exercise.title}</h2>
      <p className="muted" style={{ marginBottom: 12 }}>{exercise.desc}</p>
      <textarea placeholder={placeholder} value={text} onChange={e => setText(e.target.value)} />
      <button className="btn-primary" onClick={handleSubmit} disabled={!text.trim()}>
        Complete (+20 XP)
      </button>
    </div>
  )
}
