export const LESSON_CATEGORIES = [
  { key: 'mindset', label: 'Mindset', icon: '🧠' },
  { key: 'emotional', label: 'Emotional Intelligence', icon: '💛' },
  { key: 'finance', label: 'Finance', icon: '💰' },
  { key: 'discipline', label: 'Discipline', icon: '🎯' },
  { key: 'relationships', label: 'Relationships', icon: '🤝' }
]

export const LESSONS = [
  { id: 'm1', category: 'mindset', title: 'The Growth Mindset', body: 'Your abilities are not fixed. Every skill you have today was once something you couldn\'t do. Treat setbacks as data, not verdicts — ask "what can this teach me?" instead of "what does this say about me?"' },
  { id: 'm2', category: 'mindset', title: 'Reframing Failure', body: 'Failure is feedback compressed into an uncomfortable format. The people who progress fastest aren\'t those who fail less — they\'re the ones who recover faster and extract the lesson sooner.' },
  { id: 'e1', category: 'emotional', title: 'Naming Your Emotions', body: 'Emotional granularity — the ability to precisely label what you feel — is linked to better regulation. Instead of "I feel bad," try to identify: is it disappointment, overwhelm, envy, or fatigue?' },
  { id: 'e2', category: 'emotional', title: 'The Pause Before Reacting', body: 'Between stimulus and response there is a space. In that space is your power to choose your reaction. A few slow breaths before replying can change the entire outcome of a conversation.' },
  { id: 'f1', category: 'finance', title: 'Pay Yourself First', body: 'Before spending on wants, set aside a fixed percentage of any income for savings or investing — even 5%. Automating this removes the willpower requirement entirely.' },
  { id: 'f2', category: 'finance', title: 'Understanding Compound Growth', body: 'Small consistent contributions grow faster than people expect because growth compounds on growth. Starting early matters more than starting big.' },
  { id: 'd1', category: 'discipline', title: 'The Two-Minute Rule', body: 'If a task takes less than two minutes, do it now rather than deferring it. This prevents small tasks from piling into overwhelming backlogs.' },
  { id: 'd2', category: 'discipline', title: 'Systems Over Goals', body: 'Goals set a direction, but systems determine your progress. Instead of "I want to get fit," build a system: "I walk for 15 minutes after breakfast every day."' },
  { id: 'r1', category: 'relationships', title: 'Active Listening', body: 'Most people listen to reply, not to understand. Try reflecting back what someone said before responding — it builds trust and often reveals what they actually need.' },
  { id: 'r2', category: 'relationships', title: 'Setting Healthy Boundaries', body: 'A boundary isn\'t a punishment — it\'s information about what you need to stay well in a relationship. Clear boundaries, stated calmly, protect connection rather than damage it.' }
]

export function getLessonOfTheDay(date = new Date()) {
  const dayIndex = Math.floor(date.getTime() / 86400000)
  return LESSONS[dayIndex % LESSONS.length]
}

export const EXERCISES = [
  { id: 'breathing', title: 'Box Breathing', icon: '🫁', type: 'breathing', desc: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat for 4 rounds to calm your nervous system.', durationSec: 64 },
  { id: 'gratitude', title: 'Gratitude Reflection', icon: '🙏', type: 'gratitude', desc: 'Write down three things you\'re grateful for today, however small.' },
  { id: 'goal-setting', title: 'Goal Setting', icon: '🎯', type: 'goal', desc: 'Define one specific, achievable goal for this week and the first small step toward it.' }
]

export const CHALLENGES = [
  'Compliment someone genuinely today',
  'Take a 10 minute walk without your phone',
  'Write down one limiting belief and challenge it',
  'Drink a full glass of water before your first coffee',
  'Message someone you haven\'t spoken to in a while',
  'Spend 5 minutes journaling before bed',
  'Practice saying no to one thing that drains you',
  'Do one small task you\'ve been avoiding',
  'Reflect on one win from this week, however small',
  'Set your phone aside for the first hour after waking'
]

export function getChallengeOfTheDay(date = new Date()) {
  const dayIndex = Math.floor(date.getTime() / 86400000)
  return CHALLENGES[dayIndex % CHALLENGES.length]
}

export const MOODS = [
  { key: 'great', label: 'Great', emoji: '😄' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'okay', label: 'Okay', emoji: '🙂' },
  { key: 'stressed', label: 'Stressed', emoji: '😣' },
  { key: 'sad', label: 'Sad', emoji: '😢' }
]
