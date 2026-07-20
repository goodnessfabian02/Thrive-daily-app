import { useState, useMemo, useRef, useEffect } from 'react'
import { useJournal, JOURNAL_MOODS, JOURNAL_CATEGORIES } from '../hooks/useJournal.js'
import { useUserStats } from '../hooks/useUserStats.js'
import { hapticImpact, hapticNotification } from '../telegram.js'
import Loading from '../components/Loading.jsx'

export default function Journal() {
  const {
    entries,
    loading,
    error,
    isOnline,
    clearError,
    addEntry,
    updateEntry,
    deleteEntry,
    togglePin,
    saveDraft,
    loadDraft
  } = useJournal()
  const { addXp, isPremium } = useUserStats()

  const [view, setView] = useState('timeline') // timeline | calendar
  const [searchText, setSearchText] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [openEntry, setOpenEntry] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredEntries = useMemo(() => {
    let list = entries
    if (selectedDate) {
      list = list.filter(
        (e) => e.createdAt && e.createdAt.toDate && e.createdAt.toDate().toISOString().slice(0, 10) === selectedDate
      )
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.text || '').toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [entries, selectedDate, searchText])

  const handleSave = async (entryData, photoFile) => {
    setSaving(true)
    const result = editingEntry
      ? await updateEntry(editingEntry.id, entryData, photoFile)
      : await addEntry(entryData, photoFile)
    setSaving(false)
    if (result.ok) {
      if (!editingEntry) {
        await addXp(10, 'journal')
        hapticNotification('success')
      }
      setShowForm(false)
      setEditingEntry(null)
    }
  }

  const handleDelete = async (id) => {
    hapticImpact('medium')
    await deleteEntry(id)
    setOpenEntry(null)
  }

  if (loading) return <Loading />

  if (openEntry) {
    return (
      <EntryDetail
        entry={openEntry}
        isPremium={isPremium}
        onBack={() => setOpenEntry(null)}
        onEdit={() => {
          setEditingEntry(openEntry)
          setOpenEntry(null)
          setShowForm(true)
        }}
        onDelete={() => handleDelete(openEntry.id)}
        onTogglePin={() => togglePin(openEntry)}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Journal</h1>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg-alt)', borderRadius: 10, padding: 2 }}>
          {['timeline', 'calendar'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={view === v ? 'btn-secondary' : ''}
              style={{
                border: 'none',
                background: view === v ? 'var(--color-card)' : 'none',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                textTransform: 'capitalize',
                width: 'auto'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {!isOnline && (
        <div className="card" style={{ background: '#FEF3C7', borderColor: '#FEF3C7' }}>
          <p className="muted">📴 Offline — new entries will sync once you're back online</p>
        </div>
      )}

      {error && (
        <div className="card" onClick={clearError} style={{ borderColor: 'var(--color-danger)' }}>
          <p className="muted">⚠️ {error} (tap to dismiss)</p>
        </div>
      )}

      <input
        type="text"
        placeholder="Search entries or #tags..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {view === 'calendar' && (
        <CalendarView entries={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      )}

      {filteredEntries.length === 0 ? (
        <div className="card">
          <p className="muted">
            {entries.length === 0 ? 'No entries yet. Write your first one below.' : 'No entries match your search.'}
          </p>
        </div>
      ) : (
        filteredEntries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onOpen={() => setOpenEntry(entry)} onTogglePin={() => togglePin(entry)} />
        ))
      )}

      {!isPremium && entries.length > 5 && (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-green), var(--color-green-dark))',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: 13,
            margin: '12px 0'
          }}
        >
          ✨ Unlock AI-powered insights & smart summaries with Premium
        </div>
      )}

      <button className="fab" onClick={() => { setEditingEntry(null); setShowForm(true) }} aria-label="New entry">
        +
      </button>

      {showForm && (
        <EntryForm
          existingEntry={editingEntry}
          onClose={() => { setShowForm(false); setEditingEntry(null) }}
          onSave={handleSave}
          saving={saving}
          loadDraft={loadDraft}
          saveDraft={saveDraft}
        />
      )}
    </div>
  )
}

/* ---------- Simple rich-text editor: contentEditable + execCommand, no external libs ---------- */

function RichTextEditor({ valueHtml, onChange }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== valueHtml) {
      editorRef.current.innerHTML = valueHtml || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg)
    editorRef.current.focus()
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '6px 12px' }} onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '6px 12px' }} onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '6px 12px' }} onClick={() => exec('insertUnorderedList')}>• List</button>
        <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '6px 12px' }} onClick={() => exec('formatBlock', 'H3')}>H</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        suppressContentEditableWarning
        style={{
          minHeight: 120,
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 10,
          background: 'var(--color-bg-alt)'
        }}
      />
    </div>
  )
}

function EntryForm({ existingEntry, onClose, onSave, saving, loadDraft, saveDraft }) {
  const draft = !existingEntry ? loadDraft() : null

  const [title, setTitle] = useState(existingEntry ? existingEntry.title : draft ? draft.title : '')
  const [contentHtml, setContentHtml] = useState(existingEntry ? existingEntry.contentHtml || existingEntry.text : draft ? draft.contentHtml : '')
  const [mood, setMood] = useState(existingEntry ? existingEntry.mood : draft ? draft.mood : null)
  const [gratitude, setGratitude] = useState(existingEntry ? existingEntry.gratitude : draft ? draft.gratitude : '')
  const [category, setCategory] = useState(existingEntry ? existingEntry.category : draft ? draft.category : JOURNAL_CATEGORIES[0])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(existingEntry ? existingEntry.tags || [] : draft ? draft.tags : [])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(existingEntry ? existingEntry.photoUrl : null)

  // Autosave draft every few seconds, new entries only
  useEffect(() => {
    if (existingEntry) return
    const t = setInterval(() => saveDraft({ title, contentHtml, mood, gratitude, category, tags }), 4000)
    return () => clearInterval(t)
  }, [title, contentHtml, mood, gratitude, category, tags, existingEntry, saveDraft])

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const canSave = contentHtml.replace(/<[^>]*>/g, '').trim().length > 0 && !saving

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{existingEntry ? 'Edit Entry' : 'New Entry'}</h2>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={100} />

        <span className="field-label">Mood</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {JOURNAL_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`icon-choice${mood === m.id ? ' selected' : ''}`}
              onClick={() => setMood(m.id)}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        <span className="field-label">Entry</span>
        <RichTextEditor valueHtml={contentHtml} onChange={setContentHtml} />

        <span className="field-label">Gratitude</span>
        <textarea value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="What are you grateful for today?" rows={2} />

        <span className="field-label">Category</span>
        <div>
          {JOURNAL_CATEGORIES.map((c) => (
            <button key={c} className={`chip-selectable${category === c ? ' selected' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <span className="field-label">Tags</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="#reflection"
          />
          <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '13px 16px' }} onClick={addTag}>Add</button>
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
            {tags.map((t) => (
              <span key={t} className="chip-selectable selected" onClick={() => setTags(tags.filter((x) => x !== t))}>
                #{t} ✕
              </span>
            ))}
          </div>
        )}

        <span className="field-label">Photo</span>
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoPreview && <img src={photoPreview} alt="attachment preview" style={{ width: '100%', borderRadius: 12, marginTop: 8, maxHeight: 200, objectFit: 'cover' }} />}

        <button className="btn-primary" style={{ marginTop: 16 }} disabled={!canSave} onClick={() => onSave({ title: title.trim(), contentHtml, mood, gratitude, category, tags }, photoFile)}>
          {saving ? 'Saving…' : existingEntry ? 'Save Changes' : 'Save Entry (+10 XP)'}
        </button>
        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function EntryCard({ entry, onOpen, onTogglePin }) {
  const moodMeta = JOURNAL_MOODS.find((m) => m.id === entry.mood)
  const plainText = entry.text || (entry.contentHtml || '').replace(/<[^>]*>/g, '')
  const dateStr = formatDate(entry.createdAt)

  return (
    <div className="card card-tap" onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="muted">{dateStr}</span>
        {moodMeta && <span>{moodMeta.emoji}</span>}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin() }}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 16 }}
        >
          {entry.pinned ? '📌' : '📍'}
        </button>
      </div>
      {entry.title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.title}</div>}
      <p style={{ color: 'var(--color-text-soft)', fontSize: 14, margin: 0 }}>
        {plainText.slice(0, 120)}{plainText.length > 120 ? '…' : ''}
      </p>
      {entry.photoUrl && <img src={entry.photoUrl} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 160, objectFit: 'cover', marginTop: 6 }} />}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {entry.tags.map((t) => (
            <span key={t} className="pill">#{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function EntryDetail({ entry, isPremium, onBack, onEdit, onDelete, onTogglePin }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const moodMeta = JOURNAL_MOODS.find((m) => m.id === entry.mood)

  return (
    <div>
      <button onClick={onBack} className="btn-secondary" style={{ width: 'auto', padding: '8px 14px', marginBottom: 12 }}>
        ‹ Back
      </button>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="muted">{formatDate(entry.createdAt)}</span>
          {moodMeta && <span>{moodMeta.emoji} {moodMeta.label}</span>}
          <button onClick={onTogglePin} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18 }}>
            {entry.pinned ? '📌' : '📍'}
          </button>
        </div>

        {entry.title && <h2 style={{ marginBottom: 10 }}>{entry.title}</h2>}

        <div
          style={{ lineHeight: 1.6, marginBottom: 14 }}
          dangerouslySetInnerHTML={{ __html: entry.contentHtml || entry.text }}
        />

        {entry.photoUrl && <img src={entry.photoUrl} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 14 }} />}

        {entry.gratitude && (
          <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p className="muted" style={{ fontWeight: 600, marginBottom: 4 }}>🙏 Gratitude</p>
            <p style={{ fontSize: 14, margin: 0 }}>{entry.gratitude}</p>
          </div>
        )}

        <AIReflectionPanel entry={entry} isPremium={isPremium} />

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={onEdit}>Edit</button>
          {confirmDelete ? (
            <>
              <button className="btn-danger" onClick={onDelete}>Confirm Delete</button>
              <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

// Stubbed placeholder — wire `onRequestReflection` to the AI Coach Cloud
// Function once that module ships; it should write into `aiReflection`.
function AIReflectionPanel({ entry, isPremium }) {
  if (!isPremium) {
    return (
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 10 }}>
        <p className="muted">✨ AI Reflection is a Premium feature — coming with AI Coach</p>
      </div>
    )
  }
  return (
    <div style={{ background: 'var(--color-bg-alt)', borderRadius: 10, padding: 10 }}>
      {entry.aiReflection ? (
        <p style={{ fontSize: 14, margin: 0 }}>{entry.aiReflection}</p>
      ) : (
        <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} disabled title="Coming with AI Coach">
          ✨ Get AI Reflection
        </button>
      )}
    </div>
  )
}

function CalendarView({ entries, selectedDate, onSelectDate }) {
  const [monthCursor, setMonthCursor] = useState(new Date())

  const entriesByDate = useMemo(() => {
    const map = {}
    entries.forEach((e) => {
      if (!e.createdAt || !e.createdAt.toDate) return
      const key = e.createdAt.toDate().toISOString().slice(0, 10)
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [entries])

  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay.getDay()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button className="btn-secondary" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => setMonthCursor(new Date(year, month - 1, 1))}>‹</button>
        <span>{monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
        <button className="btn-secondary" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => setMonthCursor(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="muted" style={{ fontSize: 11 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const dateKey = new Date(year, month, d).toISOString().slice(0, 10)
          const hasEntry = !!entriesByDate[dateKey]
          const isSelected = selectedDate === dateKey
          return (
            <button
              key={i}
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              style={{
                padding: '8px 0',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                background: isSelected ? 'var(--color-green)' : hasEntry ? 'var(--color-green-light)' : '#f9fafb',
                color: isSelected ? '#fff' : 'inherit',
                fontWeight: hasEntry ? 700 : 400
              }}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return 'Just now'
  return ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
