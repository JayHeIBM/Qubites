'use client'

import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  userName: string
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-orange-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <span className="text-xl font-bold tracking-tight">Bob-a-bite 🍽️</span>
      <div className="flex items-center gap-4">
        <span className="text-orange-100 text-sm">
          Hey, <span className="font-semibold text-white">{userName}</span>!
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm bg-orange-600 hover:bg-orange-500 transition-colors px-3 py-1.5 rounded-lg font-medium"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
