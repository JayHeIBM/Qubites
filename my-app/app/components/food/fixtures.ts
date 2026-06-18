import type { FoodListing } from './types'

const now = Date.now()
const mins = (n: number) => n * 60 * 1000

/**
 * Temporary hardcoded current-user profile.
 * Replace with the real authenticated user object when auth is wired up.
 */
export const MOCK_USER = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  /** Allergen keys matching allergyColumns in lib/preferences.ts */
  allergens: ['gluten', 'tree_nut'],
  /** Restriction keys matching dietaryRestrictionColumns */
  restrictions: ['vegetarian'],
  /** Cuisine/preference keys matching cuisineColumns */
  preferences: ['italian', 'mediterranean'],
  /** Accumulated pity from raffle exclusions. Resets to 0 on selection. */
  pity: 4,
  /** Base raffle tickets — always 3 per the design doc */
  baseTickets: 3,
}

/**
 * Temporary hardcoded listings used until the backend is wired up.
 * Replace this array with the real API response — the home page grid is
 * data-agnostic and will render however many items are returned.
 */
export const MOCK_LISTINGS: FoodListing[] = [
  {
    id: 'mock-1',
    title: 'Leftover Lasagna',
    type: 'leftover',
    location: 'Floor 4 – Kitchen',
    postedAt: new Date(now - mins(12)).toISOString(),
    expiresAt: new Date(now + mins(83)).toISOString(),
    description: 'Homemade beef lasagna with ricotta. Made last night, still refrigerated.',
    portionsTotal: 10,
    portionsClaimed: 3,
    tags: [
      { label: 'Gluten',        kind: 'allergen' },
      { label: 'Dairy',         kind: 'allergen' },
      { label: 'Eggs',          kind: 'allergen' },
      { label: 'Contains Meat', kind: 'restriction' },
      { label: 'Italian',       kind: 'preference' },
      { label: 'Pasta',         kind: 'preference' },
    ],
    userCanClaim: true,
  },
  {
    id: 'mock-2',
    title: 'Free Bagels & Cream Cheese',
    type: 'free_food',
    location: 'Floor 2 – Lounge',
    postedAt: new Date(now - mins(5)).toISOString(),
    expiresAt: new Date(now + mins(45)).toISOString(),
    description: 'Assorted bagels from the morning meeting. Cream cheese and butter on the side.',
    portionsTotal: 12,
    portionsClaimed: 12,
    tags: [
      { label: 'Gluten', kind: 'allergen' },
      { label: 'Dairy',  kind: 'allergen' },
    ],
    userCanClaim: false,
  },
  {
    id: 'mock-3',
    title: 'Pasta Salad',
    type: 'leftover',
    location: 'Floor 6 – Break Room',
    postedAt: new Date(now - mins(30)).toISOString(),
    expiresAt: new Date(now + mins(25)).toISOString(),
    description: 'Cold pasta salad with cherry tomatoes, olives, and feta.',
    portionsTotal: 5,
    portionsClaimed: 2,
    tags: [
      { label: 'Gluten',      kind: 'allergen' },
      { label: 'Dairy',       kind: 'allergen' },
      { label: 'Vegetarian',  kind: 'restriction' },
      { label: 'Mediterranean', kind: 'preference' },
    ],
    userCanClaim: false,
  },
  {
    id: 'mock-4',
    title: 'Chicken Biryani',
    type: 'leftover',
    location: 'Floor 3 – Pantry',
    postedAt: new Date(now - mins(45)).toISOString(),
    expiresAt: new Date(now + mins(120)).toISOString(),
    description: 'Fragrant basmati rice with slow-cooked chicken and whole spices.',
    portionsTotal: 8,
    portionsClaimed: 4,
    tags: [
      { label: 'Contains Meat', kind: 'restriction' },
      { label: 'Indian',        kind: 'preference' },
    ],
    userCanClaim: true,
  },
  {
    id: 'mock-5',
    title: 'Vegan Sushi Platter',
    type: 'free_food',
    location: 'Floor 1 – Reception',
    postedAt: new Date(now - mins(3)).toISOString(),
    expiresAt: new Date(now + mins(60)).toISOString(),
    description: 'Assorted avocado and cucumber rolls from a catered lunch event.',
    portionsTotal: 20,
    portionsClaimed: 7,
    tags: [
      { label: 'Soy',        kind: 'allergen' },
      { label: 'Sesame',     kind: 'allergen' },
      { label: 'Vegan',      kind: 'restriction' },
      { label: 'Japanese',   kind: 'preference' },
    ],
    userCanClaim: true,
  },
  {
    id: 'mock-6',
    title: 'Assorted Desserts',
    type: 'other',
    location: 'Floor 5 – Conference Room B',
    postedAt: new Date(now - mins(20)).toISOString(),
    expiresAt: new Date(now + mins(40)).toISOString(),
    description: 'Brownies, macarons, and mini cheesecakes left over from a client presentation.',
    portionsTotal: 15,
    portionsClaimed: 9,
    tags: [
      { label: 'Gluten', kind: 'allergen' },
      { label: 'Dairy',  kind: 'allergen' },
      { label: 'Eggs',   kind: 'allergen' },
      { label: 'Nuts',   kind: 'allergen' },
      { label: 'French', kind: 'preference' },
    ],
    userCanClaim: false,
  },
]

/**
 * Temporary hardcoded upload history for the current user.
 * Replace with a real fetch filtered by uploader_id when the backend is wired up.
 * Mix of active, expired and fully-claimed to exercise all card states.
 */
export const MOCK_MY_LISTINGS: FoodListing[] = [
  {
    id: 'my-1',
    title: 'Leftover Lasagna',
    type: 'leftover',
    location: 'Floor 4 – Kitchen',
    postedAt: new Date(now - mins(12)).toISOString(),
    expiresAt: new Date(now + mins(83)).toISOString(),
    description: 'Homemade beef lasagna with ricotta. Made last night, still refrigerated.',
    portionsTotal: 10,
    portionsClaimed: 3,
    tags: [
      { label: 'Gluten',        kind: 'allergen' },
      { label: 'Dairy',         kind: 'allergen' },
      { label: 'Eggs',          kind: 'allergen' },
      { label: 'Contains Meat', kind: 'restriction' },
      { label: 'Italian',       kind: 'preference' },
      { label: 'Pasta',         kind: 'preference' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
  {
    id: 'my-2',
    title: 'Chicken Curry',
    type: 'leftover',
    location: 'Floor 3 – Pantry',
    postedAt: new Date(now - mins(2 * 60 + 15)).toISOString(),
    expiresAt: new Date(now - mins(15)).toISOString(), // expired
    description: 'Mild chicken curry with basmati rice. Enough for 6 portions.',
    portionsTotal: 6,
    portionsClaimed: 4,
    tags: [
      { label: 'Contains Meat', kind: 'restriction' },
      { label: 'Indian',        kind: 'preference' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
  {
    id: 'my-3',
    title: 'Fruit Platter',
    type: 'free_food',
    location: 'Floor 1 – Reception',
    postedAt: new Date(now - mins(50)).toISOString(),
    expiresAt: new Date(now - mins(5)).toISOString(), // expired
    description: 'Sliced seasonal fruits from a morning event.',
    portionsTotal: 10,
    portionsClaimed: 10,
    tags: [
      { label: 'Vegan',      kind: 'restriction' },
      { label: 'Vegetarian', kind: 'restriction' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
  {
    id: 'my-4',
    title: 'Sourdough Sandwiches',
    type: 'other',
    location: 'Floor 2 – Meeting Room A',
    postedAt: new Date(now - mins(25)).toISOString(),
    expiresAt: new Date(now + mins(35)).toISOString(),
    description: 'Turkey and brie sourdough sandwiches left over from a client lunch.',
    portionsTotal: 8,
    portionsClaimed: 5,
    tags: [
      { label: 'Gluten',        kind: 'allergen' },
      { label: 'Dairy',         kind: 'allergen' },
      { label: 'Contains Meat', kind: 'restriction' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
  {
    id: 'my-5',
    title: 'Vegan Brownies',
    type: 'free_food',
    location: 'Floor 5 – Kitchen',
    postedAt: new Date(now - mins(8)).toISOString(),
    expiresAt: new Date(now + mins(52)).toISOString(),
    description: 'Homemade dark chocolate brownies — vegan and gluten-free.',
    portionsTotal: 12,
    portionsClaimed: 7,
    tags: [
      { label: 'Vegan',      kind: 'restriction' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
  {
    id: 'my-6',
    title: 'Greek Salad',
    type: 'leftover',
    location: 'Floor 4 – Break Room',
    postedAt: new Date(now - mins(3 * 60)).toISOString(),
    expiresAt: new Date(now - mins(60)).toISOString(), // expired
    description: 'Classic Greek salad with olives, feta, and cucumber.',
    portionsTotal: 4,
    portionsClaimed: 2,
    tags: [
      { label: 'Dairy',         kind: 'allergen' },
      { label: 'Vegetarian',    kind: 'restriction' },
      { label: 'Mediterranean', kind: 'preference' },
    ],
    userCanClaim: false,
    showCopy: true,
  },
]
