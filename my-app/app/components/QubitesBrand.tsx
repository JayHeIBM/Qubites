/**
 * QubitesBrand
 * Displays the app logo placeholder, name, and tagline.
 * Used on the login screen and any other unauthenticated surface.
 */
export default function QubitesBrand() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Logo placeholder */}
      <div className="w-20 h-20 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-4xl select-none">
        🍽️
      </div>

      {/* App name */}
      <h1 className="text-3xl font-bold text-orange-700 tracking-tight">
        Bob-a-bite
      </h1>

      {/* Tagline */}
      <p className="text-sm text-gray-500 text-center">
        Reduce food waste, one bite at a time.
      </p>
    </div>
  )
}
