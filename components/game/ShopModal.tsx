'use client';

import { useMemo } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MousePointer2, X } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  clickLevel: number;
  energyLevel: number;
  onUpgrade: (type: 'click' | 'energy') => void;
}

interface UpgradeItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cost: number;
  userCoins: number;
  level: number;
  maxLevel: number;
  onUpgrade: () => void;
}

// --- Constants and Helpers ---
const springTransition = { type: "spring" as const, damping: 25, stiffness: 500 };
const BASE_COST = 100;
const MULTIPLIER = 1.5;
const MAX_LEVEL = 20;

const calculateCost = (level: number) => {
  return Math.floor(BASE_COST * Math.pow(MULTIPLIER, level - 1));
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

export default function ShopModal({ isOpen, onClose, userCoins, clickLevel, energyLevel, onUpgrade }: ShopModalProps) {
  const clickCost = useMemo(() => calculateCost(clickLevel), [clickLevel]);
  const energyCost = useMemo(() => calculateCost(energyLevel), [energyLevel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Main Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '20%' }} // Slides up from the bottom
            exit={{ y: '100%' }}
            transition={springTransition}
            className="fixed inset-x-0 bottom-0 h-[80%] bg-game-bg border-t border-white/10 rounded-t-[30px] z-50 p-6 shadow-2xl"
          >
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white">Upgrades</h2>
                <p className="text-sm text-slate-400">Spend Shards to grow stronger</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X size={24} />
              </button>
            </div>

            {/* Upgrades List */}
            <div className="space-y-4">
              <UpgradeItem
                icon={<MousePointer2 size={24} />}
                title="Soul Touch"
                description={`Level ${clickLevel} • +${clickLevel} per tap`}
                cost={clickCost}
                level={clickLevel}
                maxLevel={MAX_LEVEL}
                userCoins={userCoins}
                onUpgrade={() => onUpgrade('click')}
              />
              <UpgradeItem
                icon={<Zap size={24} />}
                title="Spirit Battery"
                description={`Level ${energyLevel} • Max ${energyLevel * 500}`}
                cost={energyCost}
                level={energyLevel}
                maxLevel={MAX_LEVEL}
                userCoins={userCoins}
                onUpgrade={() => onUpgrade('energy')}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function UpgradeItem({ icon, title, description, cost, userCoins, level, maxLevel, onUpgrade }: UpgradeItemProps) {
  const canAfford = userCoins >= cost;
  const isMaxed = level >= maxLevel;

  const iconBgColor = title === "Soul Touch" ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400";  

  return (
    <motion.div 
      className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between transition-colors duration-300"
      whileHover={{ scale: 1.05, borderColor: 'var(--color-game-accent)' }}
      whileTap={{ scale: 1.05, borderColor: 'var(--color-game-accent)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      
      <button 
        onClick={onUpgrade}
        disabled={!canAfford || isMaxed}
        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
          isMaxed
            ? 'bg-white/10 text-slate-500 cursor-not-allowed grayscale'
          : canAfford 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 hover:-translate-y-0.5 shadow-lg' 
            : 'bg-white/10 text-slate-500 cursor-not-allowed grayscale'
        }`}
      >
        {isMaxed ? 'MAXED' : (
          <span className="flex items-center justify-center gap-1">{formatNumber(cost)} 💎</span>
        )}
      </button>
    </motion.div>
  );
}