'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Thêm icon đóng
import { useGameSound } from '@/hooks/useGameSound';

interface InventoryProps {
    isOpen: boolean; // ✅ NEW: Nhận prop isOpen
    onClose: () => void; // ✅ NEW: Hàm đóng
    ticketCount: number;
    coffeeCount: number;
    buffWealth: number;
    buffLuck: number;
    isSleeping: boolean;
    onUseCoffee: () => void;
}

export default function InventoryView({ 
    isOpen, onClose, // Nhớ destructure
    ticketCount, coffeeCount, buffWealth, buffLuck, isSleeping, onUseCoffee 
}: InventoryProps) {
  const { playUi } = useGameSound();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. BACKDROP: Làm mờ nền, Z-Index cao */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playUi(); onClose(); }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* 2. MAIN PANEL: Trượt từ dưới lên */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: '10%' }} exit={{ y: '100%' }}
            // ✅ FIX ANIMATION: Dùng tween easeOut để mượt, không bị khựng như spring
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 h-[90%] bg-[#1e1f2e] border-t border-white/10 rounded-t-[40px] z-[100] p-6 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2 shrink-0">
               <div>
                  <h2 className="text-3xl font-black text-white">My Backpack 🎒</h2>
                  <p className="text-sm text-slate-400">Manage your items</p>
               </div>
               <button 
                onClick={() => { playUi(); onClose(); }} 
                className="p-3 bg-white/5 rounded-full hover:bg-white/10"
               >
                 <X size={20} className="text-white" />
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-6 overflow-y-auto pb-24 pr-2 flex-1">
                
                {/* SECTION 1: CONSUMABLES */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Consumables</h3>
                    <div className="grid grid-cols-2 gap-3">
                        
                        {/* 1. TRAVEL TICKET */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 relative overflow-hidden">
                            <div className="w-14 h-14 flex items-center justify-center drop-shadow-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/shop/shop-ticket.webp" alt="Ticket" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-black text-white">{ticketCount}</span>
                            <span className="text-xs text-slate-400 font-bold">Travel Tickets</span>
                            <button disabled className="w-full py-1.5 bg-white/5 text-white/30 text-[10px] font-bold rounded-lg mt-1 cursor-not-allowed">
                                Use in Travel Tab
                            </button>
                        </div>

                        {/* 2. INSTANT COFFEE */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 relative overflow-hidden">
                            <div className="w-14 h-14 flex items-center justify-center drop-shadow-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/shop/shop-coffee.webp" alt="Coffee" className="w-full h-full object-contain" />
                            </div>

                            <span className="text-2xl font-black text-white">{coffeeCount}</span>
                            <span className="text-xs text-slate-400 font-bold">Strong Coffee</span>
                            
                            {coffeeCount > 0 ? (
                                <button 
                                    onClick={onUseCoffee}
                                    disabled={!isSleeping}
                                    className={`w-full py-1.5 text-[10px] font-bold rounded-lg mt-1 transition-all ${
                                        isSleeping 
                                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' 
                                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                >
                                    {isSleeping ? "WAKE UP CAT!" : "Cat is Awake"}
                                </button>
                            ) : (
                                <button className="w-full py-1.5 bg-white/5 text-white/30 text-[10px] font-bold rounded-lg mt-1">
                                    Out of stock
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 2: ACTIVE BUFFS */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active Buffs</h3>
                    {buffWealth === 0 && buffLuck === 0 && (
                        <div className="text-center p-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-sm text-slate-500">No active buffs. Buy Mystery Box to get some!</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {/* WEALTH BUFF */}
                        {buffWealth > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-r from-yellow-900/40 to-black/40 border border-yellow-500/30 p-3 rounded-2xl flex items-center gap-4"
                            >
                                <div className="w-12 h-12 flex items-center justify-center drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse-slow">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/assets/shop/reward-wealth.webp" alt="Wealth" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-yellow-100">Wealth Potion</h4>
                                    <p className="text-xs text-yellow-500/80">x2 Coins earned</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">{buffWealth}</span>
                                    <span className="text-[10px] block text-slate-400 uppercase">Charges</span>
                                </div>
                            </motion.div>
                        )}

                        {/* LUCK BUFF */}
                        {buffLuck > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-r from-green-900/40 to-black/40 border border-green-500/30 p-3 rounded-2xl flex items-center gap-4"
                            >
                                <div className="w-12 h-12 flex items-center justify-center drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse-slow">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/assets/shop/reward-luck.webp" alt="Luck" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-100">Lucky Potion</h4>
                                    <p className="text-xs text-green-500/80">High chance for Rare items</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">{buffLuck}</span>
                                    <span className="text-[10px] block text-slate-400 uppercase">Charges</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}