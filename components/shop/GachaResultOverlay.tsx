'use client';

import { motion } from 'framer-motion';
import { GachaItemConfig } from '@/lib/game/gachaConfig';
import Image from 'next/image';
import { X } from 'lucide-react';

interface GachaResultOverlayProps {
  results: GachaItemConfig[];
  onClose: () => void;
}

export default function GachaResultOverlay({ results, onClose }: GachaResultOverlayProps) {
  const isPremiumSingle = results.length === 1;

  // Helper to determine if item is "trash" (common currency/consumable)
  const isTrash = (item: GachaItemConfig) => {
    return (item.type === 'currency' || item.type === 'consumable') && item.rarity === 'common';
  };

  // Helper for image path (placeholder logic based on type/id)
  const getImagePath = (item: GachaItemConfig) => {
    if (item.type === 'decor') return `/assets/decor/${item.id.split('_')[0]}s/${item.id}.webp`; // e.g. bed_lv1...
    if (item.type === 'currency') return '/assets/icons/star-3d.webp'; // Placeholder for gold
    if (item.type === 'consumable') return '/assets/shop/shop-coffee.webp'; // Placeholder
    return '/assets/icons/star-3d.webp';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        
        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase tracking-widest"
        >
          {isPremiumSingle ? "Premium Reward" : "Box Opened!"}
        </motion.h2>

        {/* Content */}
        {isPremiumSingle ? (
          // PREMIUM SINGLE VIEW
          <SingleItemView item={results[0]} getImagePath={getImagePath} />
        ) : (
          // STANDARD GRID VIEW
          <div className="grid grid-cols-5 gap-4 w-full">
            {results.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border-2 
                  ${!isTrash(item) 
                    ? 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                    : 'bg-white/10 border-white/10'
                  }
                `}
              >
                {!isTrash(item) && (
                  <div className="absolute inset-0 bg-yellow-400/10 rounded-xl animate-pulse" />
                )}
                <div className="relative w-12 h-12 mb-2">
                   <Image src={getImagePath(item)} alt={item.id} fill className="object-contain" />
                </div>
                <span className={`text-[10px] font-bold text-center leading-tight ${!isTrash(item) ? 'text-yellow-300' : 'text-slate-300'}`}>
                  {item.id.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-black text-white mt-1">x{item.amount.min}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onClose}
          className="mt-10 px-8 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform flex items-center gap-2"
        >
          <X size={20} />
          COLLECT
        </motion.button>
      </div>
    </div>
  );
}

function SingleItemView({ item, getImagePath }: { item: GachaItemConfig, getImagePath: (i: GachaItemConfig) => string }) {
  const isJackpot = item.rarity === 'legendary';

  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
      className="relative w-64 h-64 flex flex-col items-center justify-center"
    >
      {/* Rays Background for Jackpot */}
      {isJackpot && (
        <div className="absolute inset-0 -z-10 animate-spin-slow">
           <div className="w-full h-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent blur-xl transform rotate-45" />
           <div className="w-full h-full bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent blur-xl absolute inset-0" />
        </div>
      )}

      <div className="relative w-40 h-40 mb-4 drop-shadow-2xl">
        <Image src={getImagePath(item)} alt={item.id} fill className="object-contain" />
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-1 capitalize">{item.id.replace(/_/g, ' ')}</h3>
        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold text-yellow-300">
           x{item.amount.min} {item.type === 'material' ? 'Shards' : ''}
        </div>
      </div>
    </motion.div>
  );
}