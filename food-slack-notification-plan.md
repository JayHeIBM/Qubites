# Food Slack Notification Plan

## Top-Level Overview
Build a time-based food notification flow where Supabase is the source of truth for meal windows, eligible recipients, notification state, and claims. Supabase determines when a meal window is active and which users should be notified. The Next.js backend in [`my-app`](my-app) generates private signed links for a specific user and meal window. The Slack bot in [`slack bot/index.js`](slack%20bot/index.js) sends DMs with a button that opens that signed link. The website then verifies the token and allows the intended user to claim food for the intended meal window.

## Sub-Task 1
- **Intent**
  - Define the data model in Supabase so meal windows, eligible recipients, deliveries, and claims are all tracked in one place. This keeps scheduling and audit state out of the Slack process.
- **Expected Outcomes**
  - Supabase contains the tables and fields needed to determine active windows, compute eligible users, record notification attempts, and record claims.
- **Todo List**
  1. Define a `meal_windows` table for start time, end time, status, and food metadata.
  2. Define a table for eligible recipients for each meal window or the rules needed to derive them.
  3. Define a `notifications` table to record intended recipient, Slack user mapping, send status, link metadata, and timestamps.
  4. Define a `claims` table to record who claimed, when they claimed, and for which meal window.
  5. Define the minimal policies and service-role access boundaries so only trusted backends can create notifications and claims.
- **Relevant Context**
  - Existing Supabase client usage in [`slack bot/index.js`](slack%20bot/index.js:11)
  - Current logging pattern in [`slack bot/index.js`](slack%20bot/index.js:39)
- **Status**
  - [ ] pending

## Sub-Task 2
- **Intent**
  - Decide how Supabase determines when to notify users and how that decision is handed off for delivery. This keeps scheduling logic centralized and deterministic.
- **Expected Outcomes**
  - A clear handoff contract exists for active meal windows and eligible users, and notification rows are created exactly once per intended delivery.
- **Todo List**
  1. Create the Supabase-side scheduling approach for checking active meal windows.
  2. Define the query or function that returns eligible recipients for the active window.
  3. Create a handoff shape that the delivery layer can consume, including meal window ID, recipient identity, and delivery status.
  4. Define idempotency rules so retries do not duplicate notifications.
- **Relevant Context**
  - No existing scheduler was found in the repo.
  - The Slack bot is currently a delivery process in [`slack bot/index.js`](slack%20bot/index.js:5)
- **Status**
  - [ ] pending

## Sub-Task 3
- **Intent**
  - Add a Next.js backend endpoint that creates and verifies signed links for a specific user and meal window. This isolates private-link security in the web backend instead of the Slack worker.
- **Expected Outcomes**
  - The Next.js app can issue a signed link for a user and meal window and can later validate that link before showing the claim page.
- **Todo List**
  1. Add a server-side route in [`my-app/app`](my-app/app) for generating signed tokens from trusted backend input.
  2. Decide the token contents, expiry, and signature method.
  3. Add a server-side route or page loader that validates the token before rendering the claim experience.
  4. Ensure the validated token maps to one active meal window and one intended user.
- **Relevant Context**
  - Next.js App Router structure in [`my-app/app`](my-app/app)
  - Existing server-side pattern in [`my-app/app/lib/watsonx.ts`](my-app/app/lib/watsonx.ts)
- **Status**
  - [ ] pending

## Sub-Task 4
- **Intent**
  - Expand the Slack bot from manual testing to production delivery of DMs with a button that opens the signed link. This keeps Slack-specific formatting and delivery concerns isolated in one process.
- **Expected Outcomes**
  - The Slack bot can send a DM with Block Kit, include the website button, and update delivery status in Supabase.
- **Todo List**
  1. Replace the test-only command flow in [`slack bot/index.js`](slack%20bot/index.js:16) with a reusable send-notification function.
  2. Add Slack Block Kit message content with a button that points to the signed website link.
  3. Record delivery success and failure details back into Supabase.
  4. Keep the manual slash command as an optional test path if it remains useful for local verification.
- **Relevant Context**
  - Current DM send flow in [`slack bot/index.js`](slack%20bot/index.js:30)
  - Current Slack message post in [`slack bot/index.js`](slack%20bot/index.js:34)
- **Status**
  - [ ] pending

## Sub-Task 5
- **Intent**
  - Implement the claim flow in the website so the signed link lands the user on the correct meal window and records the result safely.
- **Expected Outcomes**
  - Users who open valid links can view the relevant food page and submit a claim that is tied to the correct meal window and recipient.
- **Todo List**
  1. Create the claim page in the Next.js app that accepts the signed-link parameters.
  2. Validate the token server-side before showing claim actions.
  3. Submit the claim to Supabase and prevent duplicate or expired claims.
  4. Show a clear success, expired, or invalid-link state.
- **Relevant Context**
  - Next.js frontend entry in [`my-app/app/page.tsx`](my-app/app/page.tsx)
  - Planned signed-link validation from Sub-Task 3
- **Status**
  - [ ] pending
