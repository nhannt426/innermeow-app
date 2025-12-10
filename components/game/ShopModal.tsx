'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Ticket, Coffee, LucideIcon, Gift } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameStore } from '@/store/useGameStore'; // ✅ 1. Import useGameStore
import { ALL_DECOR_ITEMS, DECOR_CATEGORIES, DecorType, DecorItem as DecorItemData } from '@/constants/decorItems';
import GachaPanel from '@/components/shop/GachaPanel';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSleeping: boolean; 
  // ✅ REFACTOR: Đổi tên onUpgrade thành onServerAction để rõ ràng hơn
  onServerAction: (type: string, param: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const calculateStatCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));
const ROOM_COSTS = [0, 2000, 10000, 50000, 200000, 500000, 1000000, 2500000, 5000000, 10000000]; 

const MAX_STAT_LEVEL = 21;
const MAX_ROOM_LEVEL = 10;

export default function ShopModal({ 
  isOpen, onClose, isSleeping, onServerAction, showToast
}: ShopModalProps) {
  const { playUi } = useGameSound();
  const [activeTab, setActiveTab] = useState<'essentials' | 'decor' | 'gacha'>('essentials');
  // ✅ 2. THÊM STATE BỘ LỌC
  const [activeCategory, setActiveCategory] = useState<DecorType | 'all'>('all');

  // ✅ 2. Lấy state và actions từ store (Tách lẻ để tránh re-render loop)
  const coins = useGameStore(state => state.coins);
  const userData = useGameStore(state => state.userData);

  const { spendCoins, addItemToInventory } = useGameStore.getState();

  const { clickLevel, energyLevel, sanctuaryLevel, ticketsBought, coffeeBuyCount } = userData || { clickLevel: 1, energyLevel: 1, sanctuaryLevel: 1, ticketsBought: 0, coffeeBuyCount: 0 };

  // ✅ 1. TÍNH TOÁN BIẾN HIỂN THỊ: Đảm bảo các giá trị luôn hợp lệ, tránh NaN/undefined
  const sanctuaryDisplayLevel = userData?.sanctuary_level || 1;
  // Lấy giá từ config, nếu max level thì giá là 0 (vì button sẽ disable)
  const sanctuaryPrice = ROOM_COSTS[sanctuaryDisplayLevel] || 0;

  const clickUpgradeCost = (userData?.click_level || 1) * 500;
  const energyUpgradeCost = (userData?.energy_level || 1) * 1000;

  // ✅ 1. LOGIC LỌC ITEM (Progressive Unlock)
  const filteredDecorItems = useMemo(() => {
    // Level 1 là mặc định, không bán.
    // Chỉ hiển thị các item có level <= sanctuary_level + 1 (để user ngắm trước)
    const purchasableAndVisibleItems = ALL_DECOR_ITEMS.filter(
      item => item.level > 1 && item.level <= sanctuaryDisplayLevel + 1
    );

    if (activeCategory === 'all') {
      return purchasableAndVisibleItems;
    }
    return purchasableAndVisibleItems.filter(item => item.type === activeCategory);
  }, [activeCategory, sanctuaryDisplayLevel]);

  // ✅ 3. Tạo hàm xử lý mua bán chung
  const handleBuy = useCallback((type: string, param: any, cost: number, onSuccess?: () => void) => {
    if (coins < cost) return; // Kiểm tra tiền ngay tại modal

    playUi();
    spendCoins(cost); // Trừ tiền từ store
    onServerAction(type, param); // Gọi action để xử lý logic phía server

  }, [coins, playUi, spendCoins, onServerAction]);

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
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
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
                  onClick={() => { playUi(); setActiveTab('essentials'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'essentials' ? 'bg-game-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                   Essentials
                </button>
                <button 
                  onClick={() => { playUi(); setActiveTab('decor'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'decor' ? 'bg-game-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                   Decor
                </button>
                <button 
                  onClick={() => { playUi(); setActiveTab('gacha'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'gacha' ? 'bg-game-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                   <Gift size={14} /> Mystery
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4 pb-24 overflow-y-auto flex-1 pr-2">
              
              {/* === TAB: DECOR === */}
              {activeTab === 'decor' && (
                <>
                  {/* Filter Toolbar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                    <button
                      onClick={() => { playUi(); setActiveCategory('all'); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-white text-black' : 'bg-white/10 text-slate-300'}`}
                    >
                      All
                    </button>
                    {DECOR_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { playUi(); setActiveCategory(cat); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all capitalize ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/10 text-slate-300'}`}
                      >
                        {cat}s
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {filteredDecorItems.map(item => (
                      <DecorItem 
                        key={item.id}
                        item={item}
                        currentUserLevel={sanctuaryDisplayLevel}
                        onBuy={() => handleBuy('buy_decor', { itemId: item.id, price: item.price }, item.price)}
                      />
                    ))}
                    
                    {/* ✅ 2. LOGIC "LOCKED SECTION" (Teaser) */}
                    {sanctuaryDisplayLevel < MAX_ROOM_LEVEL && (
                      <div 
                        className="bg-black/20 p-3 rounded-[20px] border border-dashed border-white/20 flex flex-col gap-2 items-center justify-center text-center cursor-pointer hover:bg-black/30 transition-all"
                        onClick={() => { playUi(); setActiveTab('essentials'); }}
                      >
                        <Lock size={24} className="text-slate-500" />
                        <h4 className="font-bold text-xs text-white">More Items Locked</h4>
                        <p className="text-[10px] text-slate-400">Unlock Sanctuary Level {sanctuaryDisplayLevel + 1} to see more!</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* === TAB: GACHA (Mystery Box) === */}
              {activeTab === 'gacha' && (
                <GachaPanel showToast={showToast} />
              )}

              {/* === TAB: ESSENTIALS (Gộp Upgrades & Daily) === */}
              {activeTab === 'essentials' && (
                <>
                  <div className="mb-6">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Sanctuary</div>
                    <UpgradeItem 
                      id="sanctuary" name="Sanctuary" desc="Evolve your room" 
                      // ✅ Đổi icon thành imgSrc
                      imgSrc="/assets/shop/shop-sanctuary.webp"
                      color="text-yellow-400" bg="bg-yellow-500/20"
                      level={sanctuaryDisplayLevel} maxLevel={MAX_ROOM_LEVEL}
                      cost={sanctuaryPrice}
                      onBuy={(id, cost) => handleBuy(id, cost, cost)}
                    />
                  </div>

                  <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Stats</div>
                  
                  <UpgradeItem 
                    id="click" name="Gift Quality" desc="Higher chance for rare items" 
                    // ✅ Đổi icon thành imgSrc
                    imgSrc="/assets/shop/shop-gift.webp"
                    color="text-pink-400" bg="bg-pink-500/20"
                    level={clickLevel} maxLevel={MAX_STAT_LEVEL}
                      cost={clickUpgradeCost}
                    onBuy={(id, cost) => handleBuy(id, cost, cost)}
                  />
                  
                  <UpgradeItem 
                    id="energy" name="Mind Space" desc="Increases Max Happiness" 
                    imgSrc="/assets/shop/shop-mind.webp"
                    color="text-cyan-400" bg="bg-cyan-500/20"
                    level={energyLevel} maxLevel={MAX_STAT_LEVEL}
                    cost={energyUpgradeCost}
                    onBuy={(id, cost) => handleBuy(id, cost, cost)}
                  />

                  <div className="pt-4">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Daily Needs</div>
                  </div>
                   {/* 1. TRAVEL TICKET */}
                   <ConsumableItem 
                      name="Travel Ticket"
                      desc="Ticket to explore the world"
                      icon={Ticket}
                      imgSrc="/assets/shop/shop-ticket.webp" 
                      cost={500} // Giá vé
                      limit={`Daily Limit: ${ticketsBought}/3`}
                      disabled={ticketsBought >= 3}
                      onBuy={() => {
                        addItemToInventory('ticket', 1); // Thêm vé vào kho (Zustand)
                        showToast("+1 Ticket Purchased! 🎫");
                        handleBuy('buy_ticket', 500, 500);
                      }}
                   />

                   {/* 2. STRONG COFFEE */}
                   <ConsumableItem 
                      name="Strong Coffee"
                      // Sửa mô tả: Báo rõ là cất vào Balo
                      desc="Store in Bag. Use to wake up kitty later." 
                      icon={Coffee}
                      imgSrc="/assets/shop/shop-coffee.webp"
                      cost={getCoffeePrice()}
                      limit="Stock up for later" 
                      disabled={false} 
                      onBuy={() => {
                        addItemToInventory('coffee', 1); // Thêm cafe vào kho (Zustand)
                        showToast("Coffee added to Bag! 🎒");
                        handleBuy('buy_coffee', getCoffeePrice(), getCoffeePrice());
                      }}
                   />
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DecorItemProps {
  item: DecorItemData;
  currentUserLevel: number;
  onBuy: () => void;
}

function DecorItem({ item, currentUserLevel, onBuy }: DecorItemProps) {
  // Lấy state và actions cần thiết từ store
  const coins = useGameStore((state) => state.coins);
  const inventory = useGameStore((state) => state.inventory);
  const { spendCoins, addItemToInventory, setEquippedDecor } = useGameStore.getState();
  
  const isLevelLocked = item.level > currentUserLevel;
  const isOwned = (inventory[item.id] || 0) > 0;
  const canAfford = coins >= item.price;
  const isDisabled = isLevelLocked || isOwned || !canAfford;

  const handleLocalBuy = () => {
    if (isDisabled) return;

    // Thực hiện các action phía client ngay lập tức
    spendCoins(item.price);
    addItemToInventory(item.id, 1);
    // Tự động trang bị, tách itemId ra khỏi prefix
    const itemIdWithoutPrefix = item.id.replace(`${item.type}_`, '');
    setEquippedDecor(item.type as any, itemIdWithoutPrefix);
    
    // Gọi callback để xử lý logic server & toast
    onBuy();
  }

  return (
    <div className={`bg-white/5 p-3 rounded-[20px] border border-white/5 flex flex-col gap-2 ${isOwned || isLevelLocked ? 'opacity-60' : ''}`}>
      <div className="aspect-square bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
        <p className="text-[10px] text-slate-400 capitalize">{item.type}</p>
      </div>
      <button
        onClick={handleLocalBuy}
        disabled={isDisabled}
        className={`w-full py-2 rounded-lg font-bold text-xs transition-all
          ${isLevelLocked
            ? 'bg-white/5 text-slate-500'
            : isOwned 
              ? 'bg-white/10 text-slate-400' 
              : canAfford 
                ? 'bg-game-primary text-white hover:brightness-110' 
                : 'bg-white/10 text-slate-500'
          }
        `}
      >
        {isLevelLocked ? `LV ${item.level} REQ.` 
          : isOwned ? 'OWNED' 
          : `${item.price.toLocaleString()} ⭐️`}
      </button>
    </div>
  );
}

interface ConsumableItemProps {
    name: string;
    desc: string;
    icon: LucideIcon;
    imgSrc: string;
    cost: number;
    limit: string;
    disabled?: boolean;
    onBuy: () => void;
}

function ConsumableItem({ name, desc, icon: Icon, imgSrc, cost, limit, disabled, onBuy }: ConsumableItemProps) {
    // Lấy coins từ store để kiểm tra
    const coins = useGameStore((state) => state.coins);
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
    onBuy: (id: string, cost: number) => void;
}

function UpgradeItem({ id, name, desc, imgSrc, color, bg, level, maxLevel, cost, onBuy }: UpgradeItemProps) {
    const isMaxed = level >= maxLevel;
    const coins = useGameStore((state) => state.coins); // Lấy coins từ store
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