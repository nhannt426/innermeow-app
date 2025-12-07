'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MousePointer2, X, Lock } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  clickLevel: number;
  energyLevel: number;
  // SỬA Ở ĐÂY: Thêm tham số `cost` vào định nghĩa hàm
  onUpgrade: (type: 'click' | 'energy', cost: number) => void;
}

// Hàm tính giá tiền (Giống Logic Backend)
const calculateCost = (level: number) => {
  return Math.floor(100 * Math.pow(1.5, level));
};

const MAX_LEVEL = 20;

export default function ShopModal({ isOpen, onClose, coins, clickLevel, energyLevel, onUpgrade }: ShopModalProps) {
  
  const springTransition = {
    type: "spring" as const,
    damping: 25,
    stiffness: 500
  };

  const upgrades = [
    {
      id: 'click',
      name: 'Soul Touch',
      desc: `+${clickLevel + 1} shards per tap`,
      icon: MousePointer2,
      currentLevel: clickLevel,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      type: 'click' as const
    },
    {
      id: 'energy',
      name: 'Spirit Battery',
      desc: `Max energy ${((energyLevel + 1) * 500).toLocaleString()}`,
      icon: Zap,
      currentLevel: energyLevel,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      type: 'energy' as const
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '10%' }}
            exit={{ y: '100%' }}
            transition={springTransition}
            className="fixed inset-x-0 bottom-0 h-[85%] bg-game-bg border-t border-white/10 rounded-t-[30px] z-50 p-6 shadow-2xl overflow-y-auto pb-20"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Upgrades</h2>
                <p className="text-sm text-slate-400 font-medium">Invest to grow faster</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X size={24} className="text-slate-300" />
              </button>
            </div>

            <div className="space-y-4">
              {upgrades.map((item) => {
                const cost = calculateCost(item.currentLevel);
                const isMaxed = item.currentLevel >= MAX_LEVEL;
                const canAfford = coins >= cost;

                return (
                  <div key={item.id} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-game-accent/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} shadow-lg group-hover:scale-110 transition-transform`}>
                          <item.icon size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-game-accent transition-colors">{item.name}</h3>
                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                            <span className="bg-black/30 px-2 py-0.5 rounded text-slate-300">Lv {item.currentLevel}</span>
                            <span>• {item.desc}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      // SỬA Ở ĐÂY: Truyền đủ 2 tham số (type, cost)
                      onClick={() => !isMaxed && onUpgrade(item.type, cost)}
                      disabled={!canAfford || isMaxed}
                      className={`w-full mt-4 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all flex items-center justify-center space-x-2
                        ${isMaxed 
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5' 
                          : canAfford 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95' 
                            : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      {isMaxed ? (
                        <><span>Max Level</span> <Lock size={14} className="ml-1"/></>
                      ) : (
                        <>{cost.toLocaleString()} 💎 UPGRADE</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}