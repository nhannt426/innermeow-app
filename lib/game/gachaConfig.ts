// 1. TYPE DEFINITIONS
// =============================================================================

export type ItemType = 'currency' | 'consumable' | 'decor' | 'skin' | 'material';
export type Rarity = 'common' | 'rare' | 'legendary';

export interface GachaItemConfig {
  id: string;
  type: ItemType;
  rarity: Rarity;
  amount: { min: number; max: number }; // Range for drop quantity
  dropRate: number; // Relative weight within its specific pool
}

export interface GachaPool {
  id: string;
  chance: number; // Probability (0.0 - 1.0) of hitting this pool
  description?: string;
  items: GachaItemConfig[];
}

// 2. STANDARD BOX CONFIGURATION
// =============================================================================
// Total Chance must sum to 1.0 (100%)

export const STANDARD_BOX_POOLS: Record<string, GachaPool> = {
  trash_pool: {
    id: 'trash_pool',
    chance: 0.60, // 60% Chance
    description: 'Common resources like Gold and Cat Food',
    items: [
      { id: 'currency_gold', type: 'currency', rarity: 'common', amount: { min: 50, max: 150 }, dropRate: 100 },
      { id: 'consumable_cat_food', type: 'consumable', rarity: 'common', amount: { min: 1, max: 3 }, dropRate: 80 },
    ]
  },
  utility_pool: {
    id: 'utility_pool',
    chance: 0.30, // 30% Chance
    description: 'Useful items for gameplay progression',
    items: [
      { id: 'consumable_ticket', type: 'consumable', rarity: 'common', amount: { min: 1, max: 1 }, dropRate: 50 },
      { id: 'consumable_speed_up', type: 'consumable', rarity: 'common', amount: { min: 1, max: 2 }, dropRate: 30 },
      { id: 'consumable_gold_buff', type: 'consumable', rarity: 'rare', amount: { min: 1, max: 1 }, dropRate: 20 },
    ]
  },
  fun_pool: {
    id: 'fun_pool',
    chance: 0.095, // 9.5% Chance
    description: 'Fun, low-tier cosmetic items',
    items: [
      { id: 'decor_meme_sock', type: 'decor', rarity: 'rare', amount: { min: 1, max: 1 }, dropRate: 40 },
      { id: 'decor_meme_box', type: 'decor', rarity: 'rare', amount: { min: 1, max: 1 }, dropRate: 40 },
      { id: 'material_paint_blue', type: 'material', rarity: 'common', amount: { min: 1, max: 5 }, dropRate: 20 },
    ]
  },
  hook_pool: {
    id: 'hook_pool',
    chance: 0.005, // 0.5% Chance
    description: 'A tiny taste of premium content to hook players',
    items: [
      { id: 'material_shard_premium', type: 'material', rarity: 'legendary', amount: { min: 1, max: 1 }, dropRate: 100 },
    ]
  }
};

// 3. PREMIUM BOX CONFIGURATION
// =============================================================================
// Total Chance must sum to 1.0 (100%)

export const PREMIUM_BOX_POOLS: Record<string, GachaPool> = {
  progress_pool: {
    id: 'progress_pool',
    chance: 0.70, // 70% Chance
    description: 'Steady progress towards premium items',
    items: [
      { id: 'material_shard_decor_premium', type: 'material', rarity: 'rare', amount: { min: 3, max: 5 }, dropRate: 50 },
      { id: 'material_shard_skin_premium', type: 'material', rarity: 'rare', amount: { min: 3, max: 5 }, dropRate: 50 },
    ]
  },
  lucky_pool: {
    id: 'lucky_pool',
    chance: 0.25, // 25% Chance
    description: 'Big burst of progress or visual flair',
    items: [
      { id: 'material_shard_decor_premium', type: 'material', rarity: 'rare', amount: { min: 10, max: 20 }, dropRate: 40 },
      { id: 'material_shard_skin_premium', type: 'material', rarity: 'rare', amount: { min: 10, max: 20 }, dropRate: 40 },
      { id: 'decor_visual_sparkle', type: 'decor', rarity: 'legendary', amount: { min: 1, max: 1 }, dropRate: 20 },
    ]
  },
  jackpot_pool: {
    id: 'jackpot_pool',
    chance: 0.05, // 5% Chance
    description: 'The ultimate prize: Full items',
    items: [
      { id: 'decor_premium_sofa', type: 'decor', rarity: 'legendary', amount: { min: 1, max: 1 }, dropRate: 50 },
      { id: 'skin_space_cat', type: 'skin', rarity: 'legendary', amount: { min: 1, max: 1 }, dropRate: 50 },
    ]
  }
};

// 5. HELPER FUNCTIONS
// =============================================================================

/**
 * Determines which pool to pick from based on the defined probability weights.
 * 
 * Algorithm:
 * 1. Generate a random number between 0 and 1.
 * 2. Iterate through pools, accumulating their chance.
 * 3. If random number < cumulative chance, pick that pool.
 * 
 * @param boxType The type of box being opened ('standard' or 'premium')
 * @returns The selected GachaPool object
 */
export const getPoolByWeight = (boxType: 'standard' | 'premium'): GachaPool => {
  const poolsMap = boxType === 'standard' ? STANDARD_BOX_POOLS : PREMIUM_BOX_POOLS;
  const pools = Object.values(poolsMap);
  
  const random = Math.random();
  let cumulativeChance = 0;

  for (const pool of pools) {
    cumulativeChance += pool.chance;
    if (random < cumulativeChance) {
      return pool;
    }
  }

  // Fallback: Return the last pool (usually the most common one if ordered that way, 
  // or just a safety return to satisfy TypeScript).
  // In a perfect math world where sum is 1.0, this line is rarely reached unless floating point errors occur.
  return pools[pools.length - 1];
};

/**
 * Picks a specific item from a pool based on item weights.
 * @param pool The pool to pick from
 */
export const getItemFromPool = (pool: GachaPool): GachaItemConfig => {
  const totalWeight = pool.items.reduce((sum, item) => sum + item.dropRate, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of pool.items) {
    if (random < item.dropRate) return item;
    random -= item.dropRate;
  }
  return pool.items[0];
};

// 6. CRAFTING CONFIGURATION
// =============================================================================

// Default number of shards required to craft an item
// You can expand this to a map (Record<string, number>) if items have different costs
export const CRAFTING_SHARD_REQUIREMENT = 10;