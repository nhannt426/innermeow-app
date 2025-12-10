'use server';

import { createClient } from '@/utils/supabase/server';
import { CRAFTING_SHARD_REQUIREMENT } from '@/lib/game/gachaConfig';

interface CraftResult {
  success: boolean;
  message: string;
  newItem?: string;
  error?: string;
}

export async function craftItem(itemId: string): Promise<CraftResult> {
  const supabase = await createClient();

  try {
    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // 2. Fetch User Profile & Inventory
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('inventory')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const inventory = profile.inventory || { shards: {}, unlocked_items: [] };
    const shards = inventory.shards || {};
    const unlockedItems = inventory.unlocked_items || [];

    // 3. Validation
    // Check if already owned
    if (unlockedItems.includes(itemId)) {
      return { success: false, message: "Item already owned", error: "ALREADY_OWNED" };
    }

    // Check shard balance
    const currentShards = shards[itemId] || 0;
    const shardsReq = CRAFTING_SHARD_REQUIREMENT; // Or lookup specific cost if implemented

    if (currentShards < shardsReq) {
      return { 
        success: false, 
        message: `Not enough shards. Need ${shardsReq}, have ${currentShards}.`, 
        error: "INSUFFICIENT_SHARDS" 
      };
    }

    // 4. Execution
    // Deduct shards
    const newShards = { ...shards };
    newShards[itemId] = currentShards - shardsReq;

    // Cleanup: Remove key if 0 to keep DB clean
    if (newShards[itemId] <= 0) {
      delete newShards[itemId];
    }

    // Unlock item
    const newUnlockedItems = [...unlockedItems, itemId];

    // 5. Database Update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        inventory: { ...inventory, shards: newShards, unlocked_items: newUnlockedItems }
      })
      .eq('id', user.id);

    if (updateError) throw new Error(updateError.message);

    return { success: true, message: "Item crafted successfully!", newItem: itemId };

  } catch (error: any) {
    console.error('Crafting Error:', error);
    return { success: false, message: "Failed to craft item", error: error.message };
  }
}
