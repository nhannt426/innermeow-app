'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Hammer } from 'lucide-react';
import { craftItem } from '@/actions/inventory-actions';
import { CRAFTING_SHARD_REQUIREMENT } from '@/lib/game/gachaConfig';
import { UserData } from '@/store/userSlice';

interface ShardsInventoryProps {
  user: UserData;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export default function ShardsInventory({ user, showToast }: ShardsInventoryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [craftingId, setCraftingId] = useState<string | null>(null);

  // 1. Data Preparation
  // Assuming user.inventory is structured as { shards: { 'item_id': amount }, ... }
  // If inventory is typed as Record<string, number> in store, we might need to adjust based on actual DB structure passed here.
  // Based on previous context, user.inventory might be a JSON object from DB.
  const inventory = user.inventory || {};
  const shards = (inventory.shards as Record<string, number>) || {};
  
  const shardItems = Object.entries(shards).map(([itemId, amount]) => {
    // In a real app, you'd fetch item details (name, image) from a config based on itemId
    // For now, we'll derive a display name from the ID
    const displayName = itemId
      .replace('material_shard_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    // Determine image path based on item type inferred from ID
    // e.g. material_shard_decor_premium -> decor
    let imagePath = '/assets/icons/star-3d.webp'; // Default
    if (itemId.includes('decor')) imagePath = '/assets/shop/shop-gift.webp';
    if (itemId.includes('skin')) imagePath = '/assets/shop/shop-ticket.webp';

    const required = CRAFTING_SHARD_REQUIREMENT;
    const progress = Math.min(100, (amount / required) * 100);
    const canCraft = amount >= required;

    return {
      id: itemId,
      name: displayName,
      amount,
      required,
      progress,
      canCraft,
      imagePath
    };
  });

  // 3. Interaction
  const handleCraft = (itemId: string) => {
    if (isPending) return;
    setCraftingId(itemId);

    startTransition(async () => {
      const result = await craftItem(itemId);
      
      if (result.success) {
        if (showToast) showToast(result.message, 'success');
        router.refresh(); // Refresh server components/data
      } else {
        if (showToast) showToast(result.message || "Crafting failed", 'error');
      }
      setCraftingId(null);
    });
  };

  // 4. Empty State
  if (shardItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Hammer className="text-slate-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-white">No shards yet</h3>
        <p className="text-sm text-slate-400 max-w-xs mt-2">
          Play the Premium Box in the Shop to find rare shards and craft powerful items!
        </p>
      </div>
    );
  }

  // 2. UI Layout (Grid)
  return (
    <div className="grid grid-cols-2 gap-4 pb-20">
      {shardItems.map((item) => (
        <div 
          key={item.id} 
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden"
        >
          {/* Icon */}
          <div className="relative w-16 h-16">
            <Image src={item.imagePath} alt={item.name} fill className="object-contain drop-shadow-md" />
          </div>

          {/* Info */}
          <div className="text-center w-full">
            <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
            
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-black/30 h-4 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 ${item.canCraft ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${item.progress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-sm">
                {item.amount} / {item.required}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleCraft(item.id)}
            disabled={!item.canCraft || isPending}
            className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all
              ${item.canCraft 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {craftingId === item.id ? <Loader2 className="animate-spin" size={14} /> : (item.canCraft ? 'CRAFT' : 'Collect More')}
          </button>
        </div>
      ))}
    </div>
  );
}