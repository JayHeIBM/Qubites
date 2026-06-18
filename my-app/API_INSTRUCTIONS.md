# Qubites API Guide

This document explains how to use the current backend APIs in [`app/api`](app/api) for user setup, chef setup, meal creation, food availability, and running assignments.

## Prerequisites

Before using these APIs, make sure:

1. Supabase schema has been created for these tables:
   - `users`
   - `user_cuisines`
   - `user_dietary_restrictions`
   - `user_allergies`
   - `food_items`
   - `food_item_cuisines`
   - `food_item_dietary_tags`
   - `food_item_allergens`
   - `food_availability`
   - `food_assignments`
2. [`my-app/.env.local`](.env.local) contains:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SLACK_BOT_TOKEN`
3. Dependencies are installed:
   ```bash
   npm install
   ```
4. The app is running:
   ```bash
   npm run dev
   ```

Base URL used below:

```bash
http://localhost:3000
```

---

## 1. Create an employee user

Endpoint:
- [`POST /api/users`](app/api/users/route.ts:31)

Example:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "slackId": "U0BBDPV8ELT",
    "name": "Richard",
    "role": "employee",
    "cuisines": ["greek", "turkish"],
    "dietaryRestrictions": ["low_carb", "high_protein"],
    "allergies": ["wheat", "gluten"]
  }'
```

Expected behavior:
- inserts a row in `users`
- inserts/updates rows in:
  - `user_cuisines`
  - `user_dietary_restrictions`
  - `user_allergies`
- attempts to send a welcome Slack DM

---

## 2. Create a chef user

Endpoint:
- [`POST /api/users`](app/api/users/route.ts:31)

Example:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "slackId": "UCHEF12345",
    "name": "Chef Demo",
    "role": "chef",
    "cuisines": [],
    "dietaryRestrictions": [],
    "allergies": []
  }'
```

Use the returned `id` later as `chefId` when creating food availability.

---

## 3. List users

Endpoint:
- [`GET /api/users`](app/api/users/route.ts:17)

Example:

```bash
curl http://localhost:3000/api/users
```

This is useful to find real UUIDs for employees and chefs.

---

## 4. Get a single user

Endpoint:
- [`GET /api/users/:id`](app/api/users/[id]/route.ts:18)

Example:

```bash
curl http://localhost:3000/api/users/USER_UUID
```

---

## 5. Update a user

Endpoint:
- [`PATCH /api/users/:id`](app/api/users/[id]/route.ts:35)

Example:

```bash
curl -X PATCH http://localhost:3000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated User",
    "cuisines": ["greek"],
    "dietaryRestrictions": ["halal"],
    "allergies": ["peanut"]
  }'
```

---

## 6. Delete a user

Endpoint:
- [`DELETE /api/users/:id`](app/api/users/[id]/route.ts:146)

Example:

```bash
curl -X DELETE http://localhost:3000/api/users/USER_UUID
```

---

## 7. Create a food item (meal)

Endpoint:
- [`POST /api/food-items`](app/api/food-items/route.ts:30)

Example: Greek meal with no dietary tags or allergens

```bash
curl -X POST http://localhost:3000/api/food-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Greek Salad Bowl",
    "cuisines": ["greek"],
    "dietaryTags": [],
    "allergens": []
  }'
```

Example: Mediterranean bowl with tags and allergens

```bash
curl -X POST http://localhost:3000/api/food-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mediterranean Bowl",
    "cuisines": ["middle_eastern", "mediterranean"],
    "dietaryTags": ["halal", "vegetarian"],
    "allergens": ["sesame"]
  }'
```

Use the returned `id` later as `foodItemId` when creating food availability.

---

## 8. List food items

Endpoint:
- [`GET /api/food-items`](app/api/food-items/route.ts:17)

Example:

```bash
curl http://localhost:3000/api/food-items
```

---

## 9. Get a single food item

Endpoint:
- [`GET /api/food-items/:id`](app/api/food-items/[id]/route.ts:19)

Example:

```bash
curl http://localhost:3000/api/food-items/FOOD_ITEM_UUID
```

---

## 10. Update a food item

Endpoint:
- [`PATCH /api/food-items/:id`](app/api/food-items/[id]/route.ts:38)

Example:

```bash
curl -X PATCH http://localhost:3000/api/food-items/FOOD_ITEM_UUID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Bowl",
    "cuisines": ["greek"],
    "dietaryTags": ["vegetarian"],
    "allergens": []
  }'
```

---

## 11. Delete a food item

Endpoint:
- [`DELETE /api/food-items/:id`](app/api/food-items/[id]/route.ts:127)

Example:

```bash
curl -X DELETE http://localhost:3000/api/food-items/FOOD_ITEM_UUID
```

---

## 12. Create food availability

Endpoint:
- [`POST /api/food-availability`](app/api/food-availability/route.ts:21)

Required inputs:
- `foodItemId`
- `chefId`
- `quantity`

Optional inputs:
- `status` (`available`, `claimed`, `expired`)
- `expiresAt`

Example:

```bash
curl -X POST http://localhost:3000/api/food-availability \
  -H "Content-Type: application/json" \
  -d '{
    "foodItemId": "FOOD_ITEM_UUID",
    "chefId": "CHEF_USER_UUID",
    "quantity": 3,
    "status": "available"
  }'
```

Example with expiry:

```bash
curl -X POST http://localhost:3000/api/food-availability \
  -H "Content-Type: application/json" \
  -d '{
    "foodItemId": "FOOD_ITEM_UUID",
    "chefId": "CHEF_USER_UUID",
    "quantity": 5,
    "status": "available",
    "expiresAt": "2026-06-18T18:30:00.000Z"
  }'
```

---

## 13. List food availability

Endpoint:
- [`GET /api/food-availability`](app/api/food-availability/route.ts:6)

Example:

```bash
curl http://localhost:3000/api/food-availability
```

This returns each availability row plus hydrated food item data.

---

## 14. Run assignment matching

Endpoint:
- [`POST /api/assignments/run`](app/api/assignments/run/route.ts:59)

Example:

```bash
curl -X POST http://localhost:3000/api/assignments/run
```

What it does:
- loads users with `role = employee`
- loads `food_availability` rows where `status = available`
- filters users against:
  - dietary restrictions
  - allergies
- randomly shuffles eligible users
- selects up to `quantity` users per available food row
- inserts rows into `food_assignments`
- sends Slack DMs via [`sendSlackDirectMessage()`](lib/slack.ts:56)

Expected response shape:

```json
{
  "assignments": [
    {
      "foodAvailabilityId": "...",
      "userId": "...",
      "slackId": "...",
      "foodName": "Greek Salad Bowl"
    }
  ]
}
```

If nobody matches, you will get:

```json
{
  "assignments": []
}
```

---

## 15. Example end-to-end flow

### Step A: create a chef

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "slackId": "UCHEF12345",
    "name": "Chef Demo",
    "role": "chef",
    "cuisines": [],
    "dietaryRestrictions": [],
    "allergies": []
  }'
```

### Step B: create an employee

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "slackId": "UEMPLOYEE1",
    "name": "Test Employee",
    "role": "employee",
    "cuisines": ["middle_eastern"],
    "dietaryRestrictions": ["halal"],
    "allergies": ["peanut"]
  }'
```

### Step C: create a meal

```bash
curl -X POST http://localhost:3000/api/food-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mediterranean Bowl",
    "cuisines": ["middle_eastern", "mediterranean"],
    "dietaryTags": ["halal"],
    "allergens": ["sesame"]
  }'
```

### Step D: create availability

```bash
curl -X POST http://localhost:3000/api/food-availability \
  -H "Content-Type: application/json" \
  -d '{
    "foodItemId": "FOOD_ITEM_UUID",
    "chefId": "CHEF_USER_UUID",
    "quantity": 2,
    "status": "available"
  }'
```

### Step E: run assignments

```bash
curl -X POST http://localhost:3000/api/assignments/run
```

---

## 16. Common errors

### `Missing Supabase server environment variables.`
Check [`lib/supabase.ts`](lib/supabase.ts:3) and make sure [`my-app/.env.local`](.env.local) contains:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### `Could not find a relationship ... in the schema cache`
This usually means a nested Supabase select path is wrong or schema relationships were changed.

### `invalid input syntax for type uuid`
You passed a placeholder like `CHEF_USER_UUID` instead of a real UUID.
Use:

```bash
curl http://localhost:3000/api/users
```

and copy the real `id`.

### `assignments: []`
The assignment route ran successfully, but no employee matched the available meals.
Check:
- employee dietary restrictions
- employee allergies
- food item dietary tags
- food item allergens
- availability status

### Slack message not sent
Check:
- `SLACK_BOT_TOKEN`
- that `slackId` is a real Slack user ID
- bot scopes and installation
- server logs from [`slack.ts`](lib/slack.ts:20)
