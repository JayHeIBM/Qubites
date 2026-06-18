'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { allergyColumns, dietaryRestrictionColumns, cuisineColumns } from '@/lib/preferences'
import { MOCK_USER } from '@/app/components/food/fixtures'
import RaffleStats from '@/app/components/profile/RaffleStats'
import PreferenceEditor from '@/app/components/profile/PreferenceEditor'

// Which editor panel is open, if any
type OpenEditor = 'allergens' | 'restrictions' | 'preferences' | null

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 select-none">
      {initials}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </h2>
  )
}

// ── Edit row ──────────────────────────────────────────────────────────────────

function EditRow({
  label,
  tags,
  tagColor,
  open,
  onToggle,
}: {
  label: string
  tags: string[]
  tagColor: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left ${
        open
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map(t => (
              <span key={t} className={`text-[11px] px-2 py-0.5 rounded-full border ${tagColor}`}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">None set</span>
        )}
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()

  // TODO: replace with real user data from auth when wired up
  const [user, setUser] = useState(MOCK_USER)
  const [openEditor, setOpenEditor] = useState<OpenEditor>(null)

  function toggleEditor(key: OpenEditor) {
    setOpenEditor(prev => (prev === key ? null : key))
  }

  function handleSave(key: 'allergens' | 'restrictions' | 'preferences', next: string[]) {
    setUser(prev => ({ ...prev, [key]: next }))
    setOpenEditor(null)
  }

  function handleSignOut() {
    // TODO: call supabase.auth.signOut() when auth is wired up
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8 flex flex-col gap-7">

      {/* ── User card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 flex items-center gap-4">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 truncate">{user.name}</p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">Avatar and name synced from Slack</p>
        </div>
      </div>

      {/* ── Raffle stats ── */}
      <section>
        <SectionHeader>Raffle Stats</SectionHeader>
        <RaffleStats
          base={user.baseTickets}
          pity={user.pity}
          preferenceBonus={0}   // TODO: derive from active listing when backend is live
        />
      </section>

      {/* ── Dietary preferences ── */}
      <section>
        <SectionHeader>Dietary Preferences</SectionHeader>
        <div className="flex flex-col gap-2">

          {/* Allergens */}
          <EditRow
            label="Allergens"
            tags={user.allergens}
            tagColor="bg-orange-50 border-orange-200 text-orange-700"
            open={openEditor === 'allergens'}
            onToggle={() => toggleEditor('allergens')}
          />
          {openEditor === 'allergens' && (
            <PreferenceEditor
              title="Edit Allergens"
              subtitle="You will be excluded from raffles for foods containing these — and gain +1 pity each time."
              items={allergyColumns}
              saved={user.allergens}
              accentBg="bg-orange-500"
              accentBorder="border-orange-500"
              onSave={next => handleSave('allergens', next)}
              onCancel={() => setOpenEditor(null)}
            />
          )}

          {/* Restrictions */}
          <EditRow
            label="Dietary Restrictions"
            tags={user.restrictions}
            tagColor="bg-purple-50 border-purple-200 text-purple-700"
            open={openEditor === 'restrictions'}
            onToggle={() => toggleEditor('restrictions')}
          />
          {openEditor === 'restrictions' && (
            <PreferenceEditor
              title="Edit Dietary Restrictions"
              subtitle="You will be excluded from raffles for foods that don't comply — and gain +1 pity each time."
              items={dietaryRestrictionColumns}
              saved={user.restrictions}
              accentBg="bg-purple-500"
              accentBorder="border-purple-500"
              onSave={next => handleSave('restrictions', next)}
              onCancel={() => setOpenEditor(null)}
            />
          )}

          {/* Preferences */}
          <EditRow
            label="Food Preferences"
            tags={user.preferences}
            tagColor="bg-green-50 border-green-200 text-green-700"
            open={openEditor === 'preferences'}
            onToggle={() => toggleEditor('preferences')}
          />
          {openEditor === 'preferences' && (
            <PreferenceEditor
              title="Edit Preferences"
              subtitle="You'll receive +1 bonus raffle ticket for any listing that matches a preference."
              items={cuisineColumns}
              saved={user.preferences}
              accentBg="bg-green-500"
              accentBorder="border-green-500"
              onSave={next => handleSave('preferences', next)}
              onCancel={() => setOpenEditor(null)}
            />
          )}
        </div>
      </section>

      {/* ── Account ── */}
      <section>
        <SectionHeader>Account</SectionHeader>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 active:scale-[0.99] transition-all text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12a9 9 0 0110-8.95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Sign out
          </button>
        </div>
      </section>

    </div>
  )
}
