'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X, Lock } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound'; // Import Hook

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  clickLevel: number;
  energyLevel: number;
  onUpgrade: (type: 'click' | 'energy', cost: number) => void;
}

const calculateCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));
const MAX_LEVEL = 20;

export default function ShopModal({ isOpen, onClose, coins, clickLevel, energyLevel, onUpgrade }: ShopModalProps) {
  // ✅ FIX: Gọi Hook Ở TRONG Component (Không được để ngoài)
  const { playUi } = useGameSound();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playUi(); onClose(); }} // Click backdrop cũng có tiếng
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
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
              <button 
                onClick={() => { playUi(); onClose(); }} // Thêm âm thanh đóng
                className="p-3 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Upgrades List */}
            <div className="space-y-4 pb-24 overflow-y-auto h-full">
              <UpgradeItem 
                id="click"
                name="Better Gifts"
                desc="Get more shards when cat is happy"
                icon={Heart}
                color="text-pink-400"
                bg="bg-pink-500/20"
                level={clickLevel}
                coins={coins}
                onBuy={(type, cost) => {
                    playUi(); // Kêu tiếng click trước
                    onUpgrade(type, cost);
                }}
              />
              
              <UpgradeItem 
                id="energy"
                name="Dream Bubbles"
                desc="Bubbles appear more often"
                icon={Sparkles}
                color="text-cyan-400"
                bg="bg-cyan-500/20"
                level={energyLevel}
                coins={coins}
                onBuy={(type, cost) => {
                    playUi(); // Kêu tiếng click trước
                    onUpgrade(type, cost);
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-component
// Lưu ý: Đã xóa props 'onClick' thừa thãi, chỉ giữ lại props cần thiết
interface UpgradeItemProps {
    id: 'click' | 'energy';
    name: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
    level: number;
    coins: number;
    onBuy: (id: 'click' | 'energy', cost: number) => void;
}

function UpgradeItem({ id, name, desc, icon: Icon, color, bg, level, coins, onBuy }: UpgradeItemProps) {
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