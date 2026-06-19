'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12L12 3l9 9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
        />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const

/**
 * AppNav
 * - md+ (≥768 px): fixed top bar with wordmark left, nav items right
 * - <md (mobile): fixed bottom bar with Home · + Add · Profile
 *
 * The prominent Add (+) button sits between Home and Profile on mobile,
 * and appears as a filled pill in the top bar on wider screens.
 */
export default function AppNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── TOP BAR (md+) ─────────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-gray-200 items-center px-6 gap-6 shadow-sm">
        {/* Wordmark */}
        <span className="mr-auto">
          <img src="/bob-a-bite-logo-final.svg" alt="Bob-a-bite" className="h-7 w-auto" />
        </span>

        {/* Home */}
        <Link
          href="/home"
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
            isActive('/home')
              ? 'bg-orange-50 text-orange-700'
              : 'text-gray-500 hover:text-orange-700 hover:bg-orange-50'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Home
        </Link>

        {/* Add — prominent pill */}
        <Link
          href="/add"
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors ${
            isActive('/add')
              ? 'bg-orange-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Add
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
            isActive('/profile')
              ? 'bg-orange-50 text-orange-700'
              : 'text-gray-500 hover:text-orange-700 hover:bg-orange-50'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Profile
        </Link>
      </header>

      {/* ── TOP BANNER (mobile, <md) ─────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-200 flex items-center justify-center shadow-sm">
        <img src="/bob-a-bite-logo-final.svg" alt="Bob-a-bite" className="h-6 w-auto" />
      </div>

      {/* ── BOTTOM BAR (mobile, <md) ──────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex items-stretch h-16 shadow-[0_-1px_6px_rgba(0,0,0,0.06)]">
        {/* Home */}
        <Link
          href="/home"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
            isActive('/home') ? 'text-orange-700' : 'text-gray-400 hover:text-orange-600'
          }`}
        >
          {NAV_ITEMS[0].icon(isActive('/home'))}
          Home
        </Link>

        {/* Add — centre raised button */}
        <Link
          href="/add"
          className="flex-1 flex flex-col items-center justify-center"
          aria-label="Add listing"
        >
          <span
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-colors ${
              isActive('/add') ? 'bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'
            } -mt-5`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className={`text-xs font-medium mt-0.5 ${isActive('/add') ? 'text-orange-700' : 'text-gray-400'}`}>
            Add
          </span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
            isActive('/profile') ? 'text-orange-700' : 'text-gray-400 hover:text-orange-600'
          }`}
        >
          {NAV_ITEMS[1].icon(isActive('/profile'))}
          Profile
        </Link>
      </nav>
    </>
  )
}
