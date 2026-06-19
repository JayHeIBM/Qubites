'use client'

import { useState } from 'react'

/** Converts a snake_case key into a human-readable label. */
function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface PreferenceEditorProps {
  title: string
  subtitle: string
  items: readonly string[]
  /** Currently saved keys */
  saved: string[]
  accentBg: string
  accentBorder: string
  onSave: (next: string[]) => void
  onCancel: () => void
}

/**
 * PreferenceEditor
 * Inline editable checklist panel — same visual language as the onboarding
 * ChecklistStep, but with Save / Cancel instead of Next.
 */
export default function PreferenceEditor({
  title,
  subtitle,
  items,
  saved,
  accentBg,
  accentBorder,
  onSave,
  onCancel,
}: PreferenceEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(saved))

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 mt-2">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>
      </div>

      {/* Scrollable checklist */}
      <div className="overflow-y-auto max-h-56 divide-y divide-gray-100 -mx-1 px-1">
        {items.map(key => {
          const checked = selected.has(key)
          const id = `pref-${key}`
          return (
            <label
              key={key}
              htmlFor={id}
              className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-white rounded-lg transition-colors select-none px-1"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              <span
                className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  checked ? `${accentBg} ${accentBorder} border-transparent` : 'border-gray-300 bg-white'
                }`}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm ${checked ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                {toLabel(key)}
              </span>
            </label>
          )
        })}
      </div>

      {selected.size === 0 && (
        <p className="text-xs text-gray-400 -mt-2">Leave blank if none apply.</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-white active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave([...selected])}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-700 active:scale-95 text-white transition-all shadow-sm"
        >
          Save
        </button>
      </div>
    </div>
  )
}
