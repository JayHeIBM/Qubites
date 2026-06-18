export type ListingType = 'leftover' | 'free_food' | 'other'

export interface FoodTag {
  label: string
  /** Controls pill colour */
  kind: 'allergen' | 'restriction' | 'preference'
}

export interface FoodListing {
  id: string
  title: string
  type: ListingType
  location: string
  /** ISO datetime string */
  postedAt: string
  /** ISO datetime string — when the listing expires */
  expiresAt: string
  description?: string
  imageUrl?: string
  portionsTotal: number
  portionsClaimed: number
  tags: FoodTag[]
  /**
   * Whether the current user has been selected in the raffle (or listing is
   * open-access). Controls whether the Claim button is shown.
   */
  userCanClaim: boolean
  /**
   * When true, renders the Copy button instead of Claim (used in Add tab).
   */
  showCopy?: boolean
}
