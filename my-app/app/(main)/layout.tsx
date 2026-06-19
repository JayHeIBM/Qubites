import AppNav from '../components/AppNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f5ff]">
      <AppNav />
      {/*
        Top padding on md+ clears the fixed top bar (h-14).
        Bottom padding on mobile clears the fixed bottom bar (h-16).
      */}
      <main className="flex-1 pt-12 pb-16 md:pt-14 md:pb-0">
        {children}
      </main>
    </div>
  )
}
