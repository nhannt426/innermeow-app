'use server';

import { createClient } from '@/utils/supabase/server'; // Assuming you have a server client util
import { 
  STANDARD_BOX_POOLS, 
  PREMIUM_BOX_POOLS, 
  getPoolByWeight, 
  getItemFromPool, 
  GachaItemConfig 
} from '@/lib/game/gachaConfig';

interface GachaResult {
  success: boolean;
  rewards: GachaItemConfig[];
  newBalance?: {
    gold: number;
    gems: number;
  };
  error?: string;
}

export async function spinGachaBox(
  boxType: 'standard' | 'premium',
  paymentMethod: 'currency' | 'ad'
): Promise<GachaResult> {
  const supabase = await createClient(); // <--- Thêm await

  try {
    // 1. Authentication & User Data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Initialize variables for updates
    let newGold = profile.gold || 0;
    let newGems = profile.gems || 0;
    let newInventory = profile.inventory || { unlocked_items: [], items: {} };
    let newDailyLimits = profile.daily_limits || { premium_ad_watch_count: 0, last_reset: new Date().toISOString() };
    
    // Ensure inventory structure exists
    if (!newInventory.unlocked_items) newInventory.unlocked_items = [];
    if (!newInventory.items) newInventory.items = {};

    const rewards: GachaItemConfig[] = [];

    // 2. Standard Box Logic
    if (boxType === 'standard') {
      // Cost Check
      if (paymentMethod === 'currency') {
        const COST = 500;
        if (newGold < COST) {
          throw new Error('Not enough Gold');
        }
        newGold -= COST;
      } else {
        // Assuming standard box doesn't support ads based on requirements, or implement if needed
        throw new Error('Invalid payment method for Standard Box');
      }

      // Loop 10 times
      for (let i = 0; i < 10; i++) {
        const pool = getPoolByWeight('standard');
        const rawItem = getItemFromPool(pool);
        
        // Clone item to avoid mutating config
        let finalItem = { ...rawItem };

        // Duplicate Handling
        if (
          (finalItem.type === 'decor' || finalItem.type === 'skin') &&
          newInventory.unlocked_items.includes(finalItem.id)
        ) {
          // Refund 50 Gold
          finalItem = {
            id: 'currency_gold_refund',
            type: 'currency',
            rarity: 'common',
            amount: { min: 50, max: 50 },
            dropRate: 0
          };
        }

        rewards.push(finalItem);
      }
    }

    // 3. Premium Box Logic
    else if (boxType === 'premium') {
      // Ad Limit Check
      if (paymentMethod === 'ad') {
        // Simple daily reset check (assuming UTC date string comparison)
        const lastResetDate = new Date(newDailyLimits.last_reset).toDateString();
        const todayDate = new Date().toDateString();
        
        if (lastResetDate !== todayDate) {
            // Reset if new day
            newDailyLimits.premium_ad_watch_count = 0;
            newDailyLimits.last_reset = new Date().toISOString();
        }

        if (newDailyLimits.premium_ad_watch_count >= 1) {
          throw new Error('Daily ad limit reached');
        }
        
        newDailyLimits.premium_ad_watch_count += 1;
      } 
      // Gem Cost Check
      else if (paymentMethod === 'currency') {
        const COST = 100;
        if (newGems < COST) {
          throw new Error('Not enough Gems');
        }
        newGems -= COST;
      }

      // Loop 1 time
      const pool = getPoolByWeight('premium');
      const rawItem = getItemFromPool(pool);
      let finalItem = { ...rawItem };

      // Full Item Handling (Duplicate -> Dust)
      // Assuming "Full Item" implies decor or skin types in premium context
      if (
        (finalItem.type === 'decor' || finalItem.type === 'skin') &&
        newInventory.unlocked_items.includes(finalItem.id)
      ) {
        // Convert to 100 Dust
        finalItem = {
            id: 'currency_dust_conversion',
            type: 'currency', // Or 'material' depending on your dust type definition
            rarity: 'common',
            amount: { min: 100, max: 100 },
            dropRate: 0
        };
        // Note: You might need to handle 'dust' specifically in inventory update below if it's a separate column or item
        // For this example, assuming it goes into inventory items or a separate field if defined.
        // If dust is a column on profile, update `newDust` variable. 
        // Here we treat it as an item added to inventory for simplicity unless specified otherwise.
      }

      rewards.push(finalItem);
    }

    // 4. Process Rewards into Inventory State
    for (const reward of rewards) {
      // Calculate actual amount
      const amount = Math.floor(Math.random() * (reward.amount.max - reward.amount.min + 1)) + reward.amount.min;
      
      if (reward.type === 'currency' && reward.id.includes('gold')) {
         newGold += amount;
      } else if (reward.type === 'decor' || reward.type === 'skin') {
         if (!newInventory.unlocked_items.includes(reward.id)) {
             newInventory.unlocked_items.push(reward.id);
         }
      } else {
         // Consumables, materials, dust, etc.
         newInventory.items[reward.id] = (newInventory.items[reward.id] || 0) + amount;
      }
    }

    // 5. Database Transaction
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        gold: newGold,
        gems: newGems,
        inventory: newInventory,
        daily_limits: newDailyLimits
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update profile: ' + updateError.message);
    }

    return {
      success: true,
      rewards,
      newBalance: { gold: newGold, gems: newGems }
    };

  } catch (error: any) {
    console.error('Gacha Error:', error);
    return {
      success: false,
      rewards: [],
      error: error.message || 'An unexpected error occurred'
    };
  }
}