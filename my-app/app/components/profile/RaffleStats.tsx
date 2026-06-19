interface StatBoxProps {
  value: number | string
  label: string
  color: 'blue' | 'purple' | 'green'
}

const COLOR: Record<StatBoxProps['color'], string> = {
  blue:   'text-orange-600',
  purple: 'text-purple-600',
  green:  'text-green-600',
}

function StatBox({ value, label, color }: StatBoxProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
      <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${COLOR[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

interface RaffleStatsProps {
  base: number
  pity: number
  /** Per-listing bonus — only shown when non-zero */
  preferenceBonus?: number
}

/**
 * RaffleStats
 * Three stat boxes: Base · Pity · Total, plus an optional preference bonus note.
 */
export default function RaffleStats({ base, pity, preferenceBonus = 0 }: RaffleStatsProps) {
  const total = base + pity + preferenceBonus

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <StatBox value={base}  label="Base tickets"  color="blue"   />
        <StatBox value={pity}  label="Pity tickets"  color="purple" />
        <StatBox value={total} label="Total tickets"  color="green"  />
      </div>

      {preferenceBonus > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          +{preferenceBonus} preference bonus active on the current listing.
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Pity accumulates each time you are excluded from a raffle. It resets to&nbsp;0 when
        you are selected — whether or not you claim the food.
      </p>
    </div>
  )
}
