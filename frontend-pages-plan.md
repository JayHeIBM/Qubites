# Frontend Pages Plan

## Overview

Build a clean, fun blue-themed frontend for the Qubites food notification app using the existing Next.js (App Router) + Tailwind CSS project in `my-app/`. Authentication is handled by Supabase Auth with Slack OAuth for regular users. Chefs access their page directly without login.

**Scope:**
- 4 new pages: Login, Main (food options), Confirmation, Chef
- Supabase Auth integration (Slack OAuth provider)
- Blue-themed UI with a fun, clean design using Tailwind CSS
- Wire to existing `meal_windows` and `claims` Supabase tables (DB managed separately)

**Out of scope:** Database migrations, Slack bot changes, signed meal-link token flow, Watson AI tagging.

---

## Sub-Tasks

---

### Sub-Task 1 — Supabase Auth Setup & Login Page

**Intent:**  
Configure Supabase Auth client-side and build the `/login` page with Slack OAuth sign-in. This is the entry point for all regular users. After login, users are redirected to the main page.

**Expected Outcomes:**
- A Supabase browser client exists for use in client components
- `/login` page renders with a "Sign in with Slack" button
- Successful OAuth flow redirects to `/` (main page)
- Unauthenticated users visiting `/` or `/confirm` are redirected to `/login`

**Todo List:**
1. Create `my-app/lib/supabase-browser.ts` — browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`
2. Create `my-app/app/auth/callback/route.ts` — OAuth callback handler that exchanges the code for a session and redirects to `/`
3. Create `my-app/app/login/page.tsx` — Login page with blue-themed card, app logo/title, tagline, and a "Sign in with Slack" button that calls `supabase.auth.signInWithOAuth({ provider: 'slack' })`
4. Create `my-app/middleware.ts` — Next.js middleware that checks for a valid Supabase session and redirects unauthenticated users away from `/` and `/confirm` to `/login`

**Relevant Context:**
- Existing server client: [`lib/supabase.ts`](my-app/lib/supabase.ts) — uses service role, do NOT use this on the client
- Package `@supabase/supabase-js` is already installed (`^2.57.4`)
- Need to install `@supabase/ssr` for browser/middleware helpers
- Environment variables needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Status:** `[x] done`

---

### Sub-Task 2 — Main Page (Active Meal Display)

**Intent:**  
Build the `/` main page that shows the currently active meal window to a logged-in user. Displays the meal name, description, dietary tags, quantity remaining, and a large "Claim" button that routes to `/confirm`.

**Expected Outcomes:**
- Main page fetches the current active meal from the `meal_windows` Supabase table (where `is_active = true` or current datetime is within the meal window)
- Displays meal card with name, description, tags (as colour-coded chips), quantity, and optional image
- Shows a fun empty/waiting state if no active meal exists
- "Claim" button navigates to `/confirm?mealId=<id>`
- User's name shown in a navbar/header with a sign-out option

**Todo List:**
1. Create `my-app/app/page.tsx` (replace existing) — server component that fetches the active meal from Supabase using the server client
2. Build `my-app/app/components/MealCard.tsx` — card component showing meal details (name, description, tags as chips, quantity, image if present)
3. Build `my-app/app/components/Navbar.tsx` — top navbar with app name, logged-in user's name, and sign-out button
4. Build `my-app/app/components/DietaryTag.tsx` — small chip component for dietary tags with colour coding (vegan = green, gluten-free = yellow, etc.)
5. Add empty state UI to main page for when no active meal is available ("No meal available right now 🍽️")

**Relevant Context:**
- `meal_windows` table expected columns: `id`, `name`, `description`, `quantity`, `dietary_tags` (array), `image_url` (nullable), `available_from`, `available_until`, `is_active`
- Existing root layout: [`app/layout.tsx`](my-app/app/layout.tsx) — uses Geist fonts, keep this
- Route to confirmation: `/confirm?mealId=<id>`

**Status:** `[x] done`

---

### Sub-Task 3 — Confirmation Page

**Intent:**  
Build the `/confirm` page where a logged-in user sees their selected meal and their own name, then confirms the claim. On confirmation, a record is written to the `claims` table and a success state is shown inline (no separate route needed).

**Expected Outcomes:**
- Page reads `mealId` from query params and fetches meal details
- Displays meal name, description, and the user's full name (from Supabase session)
- "Confirm Claim" button calls `POST /api/claims` and shows a success screen
- "Go Back" button navigates back to `/`
- If `mealId` is missing or meal not found, redirect to `/`

**Todo List:**
1. Create `my-app/app/confirm/page.tsx` — client component that reads `mealId` from `useSearchParams`, fetches meal details, shows meal + user name, and handles claim submission
2. Create `my-app/app/api/claims/route.ts` — `POST` endpoint that inserts a record into the `claims` table (`user_id`, `meal_window_id`, `claimed_at`) using the server Supabase client
3. Build success state inside `confirm/page.tsx` — shows a fun "You're all set! 🎉" message with the meal name after successful claim submission

**Relevant Context:**
- `claims` table expected columns: `id`, `user_id`, `meal_window_id`, `claimed_at`
- User ID comes from Supabase session: `supabase.auth.getUser()`
- Existing server client: [`lib/supabase.ts`](my-app/lib/supabase.ts) — use this in the API route

**Status:** `[x] done`

---

### Sub-Task 4 — Chef Page (Add Food + History)

**Intent:**  
Build the `/chef` page — open to anyone (no auth required). Chefs can add a new meal window using a form, and see a history table of all past meal windows with their claim counts.

**Expected Outcomes:**
- `/chef` page is accessible without login
- Form fields: Name, Description, Quantity (number), Dietary Tags (multi-select checkboxes: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher), Date/time autofilled to now (editable), optional image upload
- On submit, calls `POST /api/chef/meals` which inserts into `meal_windows`
- History table below the form shows: Meal name, date, quantity, claims count, dietary tags — sorted newest first
- Image upload stores in Supabase Storage (or skips storage and stores a URL if simpler for MVP)

**Todo List:**
1. Create `my-app/app/chef/page.tsx` — client page with the add-meal form and the history table below it
2. Build `my-app/app/chef/MealForm.tsx` — controlled form component with all fields, datetime autofill, dietary tag checkboxes, and optional image input
3. Build `my-app/app/chef/MealHistory.tsx` — table component that fetches from `GET /api/chef/meals` and displays history rows
4. Create `my-app/app/api/chef/meals/route.ts` — `GET` returns all meal windows with claim counts (join with `claims` table); `POST` inserts a new meal window into `meal_windows`
5. Handle image upload: if an image file is selected, upload to Supabase Storage bucket `meal-images` and store the public URL in `image_url`

**Relevant Context:**
- No auth check on `/chef` — intentionally open for MVP
- Existing server client: [`lib/supabase.ts`](my-app/lib/supabase.ts) — use in API routes
- `dietary_tags` stored as a text array in Supabase (e.g. `["vegan", "gluten-free"]`)
- `available_from` autofilled to current datetime; `is_active` set to `true` on creation

**Status:** `[x] done`

---

### Sub-Task 5 — Blue Theme & Global Styling

**Intent:**  
Apply a consistent, clean, and fun blue-themed design across all pages using Tailwind CSS. Establish shared layout wrappers, colour tokens, and reusable button/card styles so all pages feel cohesive.

**Expected Outcomes:**
- Blue colour palette applied: deep navy background or white with blue accents, bright blue CTAs, playful typography
- Shared `PageWrapper` or layout styling for consistent padding and max-width
- Buttons have hover animations (scale or shadow on hover)
- Meal cards have soft shadows and rounded corners
- Dietary tag chips are colour-coded and styled
- Login page has a centred card on a blue gradient background
- Chef page has a clean form with clear section headings

**Todo List:**
1. Update `my-app/app/globals.css` — define CSS variables for the blue palette (primary blue, light blue, dark navy, accent, background)
2. Update `my-app/tailwind.config` (or use Tailwind v4 CSS-based config) — extend theme with custom blue colour tokens
3. Create `my-app/app/components/PageWrapper.tsx` — reusable layout wrapper with consistent padding and max-width container
4. Apply themed styles to all pages created in Sub-Tasks 1–4 (login card, main meal card, confirm card, chef form + table)
5. Ensure all interactive elements (buttons, tags, cards) have hover/focus states

**Relevant Context:**
- Tailwind CSS v4 is installed — config is CSS-based in `globals.css` using `@theme` block, not `tailwind.config.js`
- Existing globals: [`app/globals.css`](my-app/app/globals.css)
- Existing layout: [`app/layout.tsx`](my-app/app/layout.tsx)

**Status:** `[x] done`

---

## Page Route Summary

| Route | Auth Required | Purpose |
|-------|--------------|---------|
| `/login` | No | Slack OAuth login |
| `/` | Yes | Active meal display + Claim button |
| `/confirm` | Yes | Claim confirmation + success state |
| `/chef` | No | Add meals + view history |
| `/auth/callback` | No | OAuth redirect handler |

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_URL=<same-as-above>
SUPABASE_SERVICE_ROLE_KEY=<existing-key>
```
