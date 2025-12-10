'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Video, Coins, Diamond, Loader2 } from 'lucide-react';
import { spinGachaBox } from '@/actions/gacha-actions';
import { useGameStore } from '@/store/useGameStore';
import GachaResultOverlay from './GachaResultOverlay';
import { GachaItemConfig } from '@/lib/game/gachaConfig';

interface GachaPanelProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function GachaPanel({ showToast }: GachaPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [rewards, setRewards] = useState<GachaItemConfig[] | null>(null);
  
  // Get user data from store
  const userData = useGameStore(state => state.userData);
  const setUserData = useGameStore(state => state.setUserData);
  const coins = useGameStore(state => state.coins);
  const gems = userData?.gems || 0; 
  
  const dailyAdCount = userData?.daily_limits?.premium_ad_watch_count || 0;
  const isAdLimitReached = dailyAdCount >= 1;

  const handleSpin = (boxType: 'standard' | 'premium', paymentMethod: 'currency' | 'ad') => {
    if (isPending) return;

    startTransition(async () => {
      const result = await spinGachaBox(boxType, paymentMethod);

      if (result.success) {
        setRewards(result.rewards);
        
        // Update Balance in Store
        if (result.newBalance && userData) {
           const updatedUserData = {
             ...userData,
             coins: result.newBalance.gold,
             gems: result.newBalance.gems,
           };
           
           // If ad was used, increment limit locally for UI feedback
           if (paymentMethod === 'ad' && boxType === 'premium') {
              const currentLimits = updatedUserData.daily_limits || { premium_ad_watch_count: 0, last_reset: null };
              updatedUserData.daily_limits = {
                  ...currentLimits,
                  premium_ad_watch_count: currentLimits.premium_ad_watch_count + 1
              };
           }

           setUserData(updatedUserData);
        }
      } else {
        showToast(result.error || "Gacha Failed", "error");
      }
    });
  };

  return (
    <>
      {/* Result Overlay */}
      {rewards && (
        <GachaResultOverlay 
          results={rewards} 
          onClose={() => setRewards(null)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        
        {/* STANDARD BOX CARD */}
        <div className="bg-gradient-to-b from-[#2a2b3d] to-[#1e1f2e] rounded-3xl p-4 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">
            GET 10 ITEMS!
          </div>
          
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-32 transition-transform group-hover:scale-105 duration-300">
              <Image src="/assets/shop/shop-box.webp" alt="Standard Box" fill className="object-contain drop-shadow-lg" />
            </div>
            <h3 className="text-xl font-black text-white mt-2">Standard Box</h3>
            <p className="text-xs text-slate-400">Common resources & decor</p>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => handleSpin('standard', 'currency')}
              disabled={isPending || coins < 500}
              className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
            >
              {isPending ? <Loader2 className="animate-spin" size={16}/> : <Coins size={16} className="text-yellow-400"/>}
              <span className="font-bold text-sm text-white">500 Gold</span>
            </button>

            <button 
              onClick={() => handleSpin('standard', 'ad')}
              disabled={isPending} 
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Video size={16} className="text-white"/>
              <span className="font-bold text-sm text-white">Watch Ad (x10)</span>
            </button>
          </div>
        </div>

        {/* PREMIUM BOX CARD */}
        <div className="bg-gradient-to-b from-[#3d2a3d] to-[#2e1e2e] rounded-3xl p-4 border border-pink-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">
            HIGH QUALITY
          </div>
          
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-32 transition-transform group-hover:scale-105 duration-300">
              <Image src="/assets/shop/reward-jackpot.png" alt="Premium Box" fill className="object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
            </div>
            <h3 className="text-xl font-black text-white mt-2">Premium Box</h3>
            <p className="text-xs text-pink-300/80">Rare Shards & Jackpots</p>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => handleSpin('premium', 'currency')}
              disabled={isPending || gems < 100}
              className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
            >
              {isPending ? <Loader2 className="animate-spin" size={16}/> : <Diamond size={16} className="text-cyan-400"/>}
              <span className="font-bold text-sm text-white">100 Gems</span>
            </button>

            <button 
              onClick={() => handleSpin('premium', 'ad')}
              disabled={isPending || isAdLimitReached}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg
                ${isAdLimitReached 
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white'
                }
              `}
            >
              <Video size={16} className={isAdLimitReached ? "text-slate-500" : "text-white"}/>
              <span className="font-bold text-sm">
                {isAdLimitReached ? "Daily Limit Reached" : "Free Daily Ad"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}