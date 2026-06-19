/** Converts a snake_case key into a human-readable label. */
function toLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface ChecklistStepProps {
  title: string
  subtitle: string
  items: readonly string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  /** Tailwind accent colour class for checked items, e.g. 'bg-orange-500' */
  accentBg?: string
  onNext: () => void
}

/**
 * ChecklistStep
 * Reusable scrollable checklist used for Allergens, Restrictions, and Preferences.
 */
export default function ChecklistStep({
  title,
  subtitle,
  items,
  selected,
  onChange,
  accentBg = 'bg-orange-500',
  onNext,
}: ChecklistStepProps) {
  function toggle(item: string) {
    const next = new Set(selected)
    if (next.has(item)) {
      next.delete(item)
    } else {
      next.add(item)
    }
    onChange(next)
  }

  return (
    <>
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto max-h-64 sm:max-h-72 -mx-1 pr-1 divide-y divide-gray-100">
        {items.map((item) => {
          const checked = selected.has(item)
          const id = `chk-${item}`
          return (
            <label
              key={item}
              htmlFor={id}
              className="flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors select-none"
            >
              {/* Hidden native checkbox drives the toggle */}
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item)}
                className="sr-only"
              />
              {/* Visual checkbox */}
              <span
                className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  checked
                    ? `${accentBg} border-transparent`
                    : 'border-gray-300 bg-white'
                }`}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm ${checked ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                {toLabel(item)}
              </span>
            </label>
          )
        })}
      </div>

      {/* None-selected hint */}
      {selected.size === 0 && (
        <p className="text-xs text-gray-400 -mt-2">
          Leave blank if none apply.
        </p>
      )}

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl text-sm shadow-md"
      >
        Next
      </button>
    </>
  )
}
