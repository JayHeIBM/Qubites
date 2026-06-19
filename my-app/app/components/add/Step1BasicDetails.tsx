'use client'

import { useRef } from 'react'
import type { ListingType } from '@/app/components/food/types'
import type { NewListingForm } from './formState'

// ── Constants ─────────────────────────────────────────────────────────────────

const LISTING_TYPES: { value: ListingType; label: string; desc: string }[] = [
  { value: 'leftover',  label: 'Leftover',  desc: 'Raffle · pity applies' },
  { value: 'free_food', label: 'Free Food', desc: 'Open · no pity' },
  { value: 'other',     label: 'Other',     desc: 'Raffle · pity applies' },
]

const LOCATIONS = [
  'Floor 9',
  'Floor 10',
  'Floor 11',
  'Floor 12',
  'Floor 13',
  'Floor 14',
  'Floor 15',
  'Floor 16',
  'Floor 17',
]

// ── Helper ────────────────────────────────────────────────────────────────────

/** Returns a datetime-local string rounded to the next 15-min boundary. */
function defaultExpiry(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000) // +2 h
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return d.toISOString().slice(0, 16)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-sm text-gray-900 rounded-xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition appearance-none"
    />
  )
}

// ── Step 1 component ──────────────────────────────────────────────────────────

interface Step1Props {
  form: NewListingForm
  onChange: (patch: Partial<NewListingForm>) => void
  onNext: () => void
}

export default function Step1BasicDetails({ form, onChange, onNext }: Step1Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const url = URL.createObjectURL(file)
    onChange({ imageFile: file, imagePreviewUrl: url })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFile(e.dataTransfer.files)
  }

  // Validate required fields before advancing
  function handleNext() {
    if (
      !form.title.trim() ||
      !form.portions.trim() ||
      !form.availableUntil ||
      !form.location
    ) return
    onNext()
  }

  const isFreeFood = form.type === 'free_food'
  const canAdvance = !!(form.title.trim() && form.portions.trim() && form.availableUntil && form.location)

  return (
    <div className="flex flex-col gap-5">

      {/* ── Type selector ── */}
      <div>
        <FieldLabel required>Type</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {LISTING_TYPES.map(({ value, label, desc }) => {
            const selected = form.type === value
            const isGreen = value === 'free_food'
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ type: value })}
                className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? isGreen
                      ? 'border-green-500 bg-green-50'
                      : 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                  selected ? (isGreen ? 'text-green-700' : 'text-orange-700') : 'text-gray-700'
                }`}>
                  {label}
                </span>
                <span className={`text-[10px] leading-tight ${
                  selected ? (isGreen ? 'text-green-600' : 'text-orange-600') : 'text-gray-400'
                }`}>
                  {desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Free Food notice */}
      {isFreeFood && (
        <div className="flex gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <span className="text-green-500 font-bold flex-shrink-0">ℹ</span>
          <span>
            <strong>Free Food listing:</strong> All users are invited immediately. No raffle runs. No pity changes.
          </span>
        </div>
      )}

      {/* ── Title + Portions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Title</FieldLabel>
          <Input
            type="text"
            placeholder="e.g. Leftover Lasagna"
            value={form.title}
            onChange={e => onChange({ title: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>Number of portions</FieldLabel>
          <Input
            type="number"
            placeholder="e.g. 10"
            min={1}
            value={form.portions}
            onChange={e => onChange({ portions: e.target.value })}
          />
        </div>
      </div>

      {/* ── Expiry + Location ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Available until</FieldLabel>
          <Input
            type="datetime-local"
            value={form.availableUntil}
            onChange={e => onChange({ availableUntil: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>Location (floor)</FieldLabel>
          <div className="relative">
            <Select
              value={form.location}
              onChange={e => onChange({ location: e.target.value })}
            >
              <option value="">Select a floor…</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      <div>
        <FieldLabel>Description <span className="font-normal text-gray-400">(optional)</span></FieldLabel>
        <textarea
          rows={3}
          placeholder="Any details about the food — ingredients, freshness, etc."
          value={form.description}
          onChange={e => onChange({ description: e.target.value })}
          className="w-full px-3 py-2.5 text-sm text-gray-900 rounded-xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* ── Photo upload ── */}
      <div>
        <FieldLabel>Photo <span className="font-normal text-gray-400">(optional)</span></FieldLabel>
        {form.imagePreviewUrl ? (
          <div className="flex flex-col gap-1.5">
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imagePreviewUrl} alt="Preview" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => onChange({ imageFile: null, imagePreviewUrl: null })}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full w-7 h-7 flex items-center justify-center shadow text-xs font-bold transition"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
            {form.imagePreviewUrl.startsWith('http') && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0 text-gray-400">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs text-gray-500 truncate font-mono">{form.imagePreviewUrl}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition text-gray-400 text-sm"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 16.7A4 4 0 0017 9h-.6A7 7 0 104 15.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Drag &amp; drop a photo, or <span className="text-orange-500 font-semibold">browse</span></span>
            <span className="text-xs text-gray-300">JPG, PNG · max 10 MB</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => handleFile(e.target.files)}
        />
      </div>

      {/* ── Next button ── */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!canAdvance}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-sm bg-orange-600 hover:bg-orange-700 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        Next: Review Tags →
      </button>
    </div>
  )
}
