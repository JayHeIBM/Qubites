'use client'

import { useState } from 'react'
import QubitesBrand from '../components/QubitesBrand'
import SlackSignInButton from '../components/SlackSignInButton'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function handleSlackSignIn() {
    setLoading(true)
    // Kick off the Slack OAuth flow — the browser will follow the redirect chain:
    //   /api/auth/slack  →  slack.com  →  /api/auth/slack/callback  →  /onboarding or /home
    window.location.href = '/api/auth/slack'
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col items-center gap-8 w-full max-w-xs sm:max-w-sm">
        <QubitesBrand />
        <SlackSignInButton onClick={handleSlackSignIn} loading={loading} />
      </div>
    </main>
  )
}
