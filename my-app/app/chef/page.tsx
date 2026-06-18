'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import MealHistory from './MealHistory'

const DIETARY_OPTIONS = [
  'Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher',
]

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ChefPage() {
  const now = new Date()
  const defaultFrom = toLocalDatetimeString(now)
  const defaultUntil = toLocalDatetimeString(new Date(now.getTime() + 2 * 60 * 60 * 1000))

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [tags, setTags] = useState<string[]>([])
  const [availableFrom, setAvailableFrom] = useState(defaultFrom)
  const [availableUntil, setAvailableUntil] = useState(defaultUntil)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [historyKey, setHistoryKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('quantity', String(quantity))
      formData.append('dietary_tags', JSON.stringify(tags.map((t) => t.toLowerCase().replace(' ', '-'))))
      formData.append('available_from', new Date(availableFrom).toISOString())
      formData.append('available_until', new Date(availableUntil).toISOString())
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch('/api/chef/meals', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json()
        setErrorMsg(body.error ?? 'Failed to add meal.')
        return
      }

      setSuccessMsg(`"${name}" added successfully! 🎉`)
      setName('')
      setDescription('')
      setQuantity(10)
      setTags([])
      setAvailableFrom(defaultFrom)
      setAvailableUntil(defaultUntil)
      setImageFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setHistoryKey((k) => k + 1)
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <span className="text-xl font-bold tracking-tight">Qubites 🍽️ — Chef Portal</span>
        <Link href="/" className="text-blue-200 hover:text-white text-sm transition-colors">← User view</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Add Meal Form */}
        <section className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          <h1 className="text-2xl font-bold text-blue-900 mb-1">Add a Meal Window</h1>
          <p className="text-sm text-gray-400 mb-6">Fill in the details to make a meal available for claiming.</p>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Meal Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Butter Chicken"
                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Creamy tomato-based chicken curry..."
                rows={3}
                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Quantity (servings) *</label>
              <input
                required
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-32 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">Dietary Tags</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleTag(opt)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      tags.includes(opt)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Available From *</label>
                <input
                  required
                  type="datetime-local"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Available Until *</label>
                <input
                  required
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                  className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Image (optional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-2xl text-base transition-all active:scale-95 shadow-md"
            >
              {submitting ? 'Adding meal…' : 'Add Meal Window'}
            </button>
          </form>
        </section>

        {/* History */}
        <section className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-5">Meal History</h2>
          <MealHistory key={historyKey} />
        </section>
      </main>
    </div>
  )
}
