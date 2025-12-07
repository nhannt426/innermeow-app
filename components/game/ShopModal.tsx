'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X, Lock, ArrowUpCircle } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  clickLevel: number; // Tương ứng Affection Level
  energyLevel: number; // Tương ứng Bubble Rate
  onUpgrade: (type: 'click' | 'energy', cost: number) => void;
}

const calculateCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));
const MAX_LEVEL = 20;
const { playUi } = useGameSound();

export default function ShopModal({ isOpen, onClose, coins, clickLevel, energyLevel, onUpgrade }: ShopModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: '10%' }} exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 h-[85%] bg-[#1e1f2e] border-t border-white/10 rounded-t-[40px] z-50 p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <h2 className="text-3xl font-black text-white">Magic Shop</h2>
                <p className="text-sm text-slate-400">Make your cat happier</p>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10">
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Upgrades List */}
            <div className="space-y-4 pb-24 overflow-y-auto h-full">
              {/* Item 1: Better Gifts (Thay cho Click Power) */}
              <UpgradeItem 
                onClick={() => playUi()}
                id="click"
                name="Better Gifts"
                desc="Get more shards when cat is happy"
                icon={Heart}
                color="text-pink-400"
                bg="bg-pink-500/20"
                level={clickLevel}
                coins={coins}
                onBuy={onUpgrade}
              />
              
              {/* Item 2: More Bubbles (Thay cho Energy) */}
              <UpgradeItem 
                onClick={() => playUi()}
                id="energy"
                name="Dream Bubbles"
                desc="Bubbles appear more often"
                icon={Sparkles}
                color="text-cyan-400"
                bg="bg-cyan-500/20"
                level={energyLevel}
                coins={coins}
                onBuy={onUpgrade}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-component cho gọn
function UpgradeItem({ id, name, desc, icon: Icon, color, bg, level, coins, onBuy }: any) {
  const cost = calculateCost(level);
  const isMaxed = level >= MAX_LEVEL;
  const canAfford = coins >= cost;

  return (
    <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{name}</h3>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-slate-500 uppercase font-bold">Level</span>
          <span className="text-xl font-black text-white">{level}</span>
        </div>
      </div>

      <button 
        onClick={() => !isMaxed && onBuy(id, cost)}
        disabled={!canAfford || isMaxed}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
          ${isMaxed ? 'bg-white/5 text-slate-500' : canAfford ? 'bg-game-primary text-white hover:brightness-110 shadow-lg shadow-purple-500/20' : 'bg-white/10 text-slate-500 opacity-50'}
        `}
      >
        {isMaxed ? <><Lock size={14}/> MAXED</> : <>{cost.toLocaleString()} ⭐️ UPGRADE</>}
      </button>
    </div>
  )
}