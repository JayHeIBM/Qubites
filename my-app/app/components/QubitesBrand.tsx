/**
 * QubitesBrand
 * Displays the app logo placeholder, name, and tagline.
 * Used on the login screen and any other unauthenticated surface.
 */
export default function QubitesBrand() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo */}
      <img src="/bob-a-bite-logo-final.svg" alt="Bob-a-bite" className="h-12 w-auto" />

      {/* Tagline */}
      <p className="text-sm text-gray-500 text-center">
        Reduce food waste, one bite at a time.
      </p>
    </div>
  )
}
