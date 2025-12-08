'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Ticket, Coffee, LucideIcon } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  clickLevel: number;   
  energyLevel: number;  
  sanctuaryLevel: number;
  ticketsBought: number;
  coffeeBuyCount: number;
  isSleeping: boolean; 
  onUpgrade: (type: string, cost: number) => void; 
}

const calculateStatCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));
const ROOM_COSTS = [0, 2000, 10000, 50000, 200000]; 

const MAX_STAT_LEVEL = 21;
const MAX_ROOM_LEVEL = 5;

export default function ShopModal({ 
  isOpen, onClose, coins, 
  clickLevel, energyLevel, sanctuaryLevel, 
  ticketsBought, coffeeBuyCount, isSleeping,
  onUpgrade 
}: ShopModalProps) {
  const { playUi } = useGameSound();
  const [activeTab, setActiveTab] = useState<'upgrades' | 'daily'>('upgrades');

  const getCoffeePrice = () => {
    if (coffeeBuyCount === 0) return 200;
    if (coffeeBuyCount === 1) return 1000;
    return 3000;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playUi(); onClose(); }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: '10%' }} exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 h-[85%] bg-[#1e1f2e] border-t border-white/10 rounded-t-[40px] z-[100] p-6 shadow-2xl flex flex-col"
          >
            {/* Header & Tabs */}
            <div className="flex justify-between items-center mb-4 px-2 shrink-0">
               <div>
                  <h2 className="text-3xl font-black text-white">Magic Shop</h2>
                  <p className="text-sm text-slate-400">Spend coins wisely</p>
               </div>
               <button onClick={() => { playUi(); onClose(); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><X size={20} className="text-white" /></button>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex bg-black/20 p-1 rounded-xl mb-4">
                <button 
                  onClick={() => { playUi(); setActiveTab('upgrades'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upgrades' ? 'bg-game-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                   Upgrades
                </button>
                <button 
                  onClick={() => { playUi(); setActiveTab('daily'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'daily' ? 'bg-game-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                   Daily Needs
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4 pb-24 overflow-y-auto flex-1 pr-2">
              
              {/* === TAB 1: UPGRADES === */}
              {activeTab === 'upgrades' && (
                <>
                  <div className="mb-6">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Sanctuary</div>
                    <UpgradeItem 
                      id="sanctuary" name="Sanctuary" desc="Evolve your room" 
                      // ✅ Đổi icon thành imgSrc
                      imgSrc="/assets/shop/shop-sanctuary.webp"
                      color="text-yellow-400" bg="bg-yellow-500/20"
                      level={sanctuaryLevel} maxLevel={MAX_ROOM_LEVEL}
                      cost={ROOM_COSTS[sanctuaryLevel] || 0} coins={coins}
                      onBuy={(t, c) => { playUi(); onUpgrade(t, c); }}
                    />
                  </div>

                  <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Stats</div>
                  
                  <UpgradeItem 
                    id="click" name="Gift Quality" desc="Higher chance for rare items" 
                    // ✅ Đổi icon thành imgSrc
                    imgSrc="/assets/shop/shop-gift.webp"
                    color="text-pink-400" bg="bg-pink-500/20"
                    level={clickLevel} maxLevel={MAX_STAT_LEVEL}
                    cost={calculateStatCost(clickLevel)} coins={coins}
                    onBuy={(t, c) => { playUi(); onUpgrade(t, c); }}
                  />
                  
                  <UpgradeItem 
                    id="energy" name="Mind Space" desc="Increases Max Happiness" 
                    // ✅ Đổi icon thành imgSrc
                    imgSrc="/assets/shop/shop-mind.webp"
                    color="text-cyan-400" bg="bg-cyan-500/20"
                    level={energyLevel} maxLevel={MAX_STAT_LEVEL}
                    cost={calculateStatCost(energyLevel)} coins={coins}
                    onBuy={(t, c) => { playUi(); onUpgrade(t, c); }}
                  />
                </>
              )}

              {/* === TAB 2: DAILY NEEDS === */}
              {activeTab === 'daily' && (
                <>
                   {/* 1. TRAVEL TICKET */}
                   <ConsumableItem 
                      name="Travel Ticket"
                      desc="Ticket to explore the world"
                      icon={Ticket}
                      imgSrc="/assets/shop/shop-ticket.webp" 
                      cost={500}
                      coins={coins}
                      limit={`Daily Limit: ${ticketsBought}/3`}
                      disabled={ticketsBought >= 3}
                      // ConsumableItem gọi trực tiếp hàm không tham số, nên không bị lỗi
                      onBuy={() => { playUi(); onUpgrade('buy_ticket', 500); }}
                   />

                   {/* 2. STRONG COFFEE */}
                   <ConsumableItem 
                      name="Strong Coffee"
                      // Sửa mô tả: Báo rõ là cất vào Balo
                      desc="Store in Bag. Use to wake up kitty later." 
                      icon={Coffee}
                      imgSrc="/assets/shop/shop-coffee.webp"
                      cost={getCoffeePrice()}
                      coins={coins}
                      // Xóa logic check ngủ, chỉ hiện thông báo giá
                      limit="Stock up for later" 
                      // Xóa disabled (chỉ disabled khi không đủ tiền - logic này đã có sẵn trong ConsumableItem nhờ check 'coins')
                      disabled={false} 
                      onBuy={() => { playUi(); onUpgrade('buy_coffee', getCoffeePrice()); }}
                   />

                   {/* 3. MYSTERY BOX */}
                   <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/shop/shop-box.webp" alt="Box" className="w-full h-full object-contain p-2 animate-pulse-slow" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-base text-white">Mystery Box</h3>
                                <p className="text-[11px] text-slate-400 leading-tight">Chance to get Potions, Tickets & Jackpot!</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {/* Nút Mua Lẻ */}
                            <button 
                                onClick={() => { playUi(); onUpgrade('buy_mystery_box', 1); }} // quantity = 1
                                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs text-white transition-all border border-white/10"
                            >
                                Open x1 (600 ⭐️)
                            </button>
                            
                            {/* Nút Mua Sỉ (Nổi bật hơn) */}
                            <button 
                                onClick={() => { playUi(); onUpgrade('buy_mystery_box', 10); }} // quantity = 10
                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-xs text-white shadow-lg hover:brightness-110 transition-all"
                            >
                                Open x10 (5,500 ⭐️)
                            </button>
                        </div>
                   </div>
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ✅ FIX: Định nghĩa Interface rõ ràng cho ConsumableItem
interface ConsumableItemProps {
    name: string;
    desc: string;
    icon: LucideIcon;
    imgSrc: string;
    cost: number;
    coins: number;
    limit: string;
    disabled?: boolean;
    onBuy: () => void;
}

function ConsumableItem({ name, desc, icon: Icon, imgSrc, cost, coins, limit, disabled, onBuy }: ConsumableItemProps) {
    const canAfford = coins >= cost;
    const isLocked = disabled || !canAfford;
  
    return (
      <div className={`bg-white/5 p-4 rounded-[24px] border border-white/5 flex items-center gap-4 ${disabled ? 'opacity-50 grayscale' : ''}`}>
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={imgSrc} alt={name} className="w-full h-full object-contain p-2" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-base text-white truncate">{name}</h3>
             <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 whitespace-nowrap">{limit}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-1">{desc}</p>
          
          <button 
            onClick={onBuy}
            disabled={isLocked}
            className={`mt-3 w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all
              ${isLocked ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg hover:scale-[1.02]'}
            `}
          >
            {cost.toLocaleString()} ⭐️ BUY NOW
          </button>
        </div>
      </div>
    )
}

// ✅ FIX: Định nghĩa Interface rõ ràng cho UpgradeItem
interface UpgradeItemProps {
    id: string;
    name: string;
    desc: string;
    imgSrc: string; // <-- Thay icon bằng imgSrc
    color: string;
    bg: string;
    level: number;
    maxLevel: number;
    cost: number;
    coins: number;
    onBuy: (id: string, cost: number) => void;
}

function UpgradeItem({ id, name, desc, imgSrc, color, bg, level, maxLevel, cost, coins, onBuy }: UpgradeItemProps) {
    const isMaxed = level >= maxLevel;
    const canAfford = coins >= cost;
  
    return (
      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {/* Container chứa ảnh 3D */}
          <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0`}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={imgSrc} alt={name} className="w-full h-full object-contain p-2 drop-shadow-md" />
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