'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Gift, BrainCircuit, Home, X, Lock } from 'lucide-react'; 
import { useGameSound } from '@/hooks/useGameSound';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  clickLevel: number;   
  energyLevel: number;  
  sanctuaryLevel: number;
  onUpgrade: (type: 'click' | 'energy' | 'sanctuary', cost: number) => void;
}

const calculateStatCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));
const ROOM_COSTS = [0, 2000, 10000, 50000, 200000]; 

const MAX_STAT_LEVEL = 21;
const MAX_ROOM_LEVEL = 5;

export default function ShopModal({ isOpen, onClose, coins, clickLevel, energyLevel, sanctuaryLevel, onUpgrade }: ShopModalProps) {
  const { playUi } = useGameSound();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playUi(); onClose(); }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: '10%' }} exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 h-[85%] bg-[#1e1f2e] border-t border-white/10 rounded-t-[40px] z-50 p-6 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2 shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white">Magic Shop</h2>
                <p className="text-sm text-slate-400">Upgrade your sanctuary</p>
              </div>
              <button 
                onClick={() => { playUi(); onClose(); }} 
                className="p-3 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Upgrades List */}
            <div className="space-y-4 pb-24 overflow-y-auto flex-1 pr-2">
              
              {/* SANCTUARY */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Special Upgrade</div>
                <UpgradeItem 
                  id="sanctuary"
                  name="Sanctuary"
                  desc="Evolve your room to a new dimension"
                  icon={Home}
                  color="text-yellow-400"
                  bg="bg-yellow-500/20"
                  level={sanctuaryLevel}
                  maxLevel={MAX_ROOM_LEVEL}
                  cost={ROOM_COSTS[sanctuaryLevel] || 0}
                  coins={coins}
                  onBuy={(type, cost) => { playUi(); onUpgrade(type, cost); }}
                />
              </div>

              {/* STATS */}
              <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Stats</div>
              
              <UpgradeItem 
                id="click"
                name="Gift Quality"
                desc="Higher chance for rare items"
                icon={Gift}
                color="text-pink-400"
                bg="bg-pink-500/20"
                level={clickLevel}
                maxLevel={MAX_STAT_LEVEL}
                cost={calculateStatCost(clickLevel)}
                coins={coins}
                onBuy={(type, cost) => { playUi(); onUpgrade(type, cost); }}
              />
              
              <UpgradeItem 
                id="energy"
                name="Mind Space"
                // ✅ UPDATE: Sửa mô tả để khớp logic mới
                desc="Increases Max Happiness capacity" 
                icon={BrainCircuit}
                color="text-cyan-400"
                bg="bg-cyan-500/20"
                level={energyLevel}
                maxLevel={MAX_STAT_LEVEL}
                cost={calculateStatCost(energyLevel)}
                coins={coins}
                onBuy={(type, cost) => { playUi(); onUpgrade(type, cost); }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-component
interface UpgradeItemProps {
    id: 'click' | 'energy' | 'sanctuary';
    name: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
    level: number;
    maxLevel: number;
    cost: number;
    coins: number;
    onBuy: (id: 'click' | 'energy' | 'sanctuary', cost: number) => void;
}

function UpgradeItem({ id, name, desc, icon: Icon, color, bg, level, maxLevel, cost, coins, onBuy }: UpgradeItemProps) {
  const isMaxed = level >= maxLevel;
  const canAfford = coins >= cost;

  return (
    <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base text-white">{name}</h3>
          <p className="text-[11px] text-slate-400 leading-tight">{desc}</p>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Level</span>
          <span className="text-lg font-black text-white">{level} <span className="text-slate-600 text-sm">/ {maxLevel}</span></span>
        </div>
      </div>

      <button 
        onClick={() => !isMaxed && onBuy(id, cost)}
        disabled={!canAfford || isMaxed}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
          ${isMaxed ? 'bg-white/5 text-slate-500' : canAfford ? 'bg-game-primary text-white hover:brightness-110 shadow-lg shadow-purple-500/20' : 'bg-white/10 text-slate-500 opacity-50'}
        `}
      >
        {isMaxed ? <><Lock size={14}/> MAXED</> : <>{cost.toLocaleString()} ⭐️ UPGRADE</>}
      </button>
    </div>
  )
}