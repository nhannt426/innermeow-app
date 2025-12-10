'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Thêm icon đóng
import { useGameSound } from '@/hooks/useGameSound';
import { useGameStore } from '@/store/useGameStore';
import { ITEM_DATA, ItemData } from '@/constants/itemData';
import { ALL_DECOR_ITEMS, DecorItem as DecorItemData, DecorType } from '@/constants/decorItems';

interface InventoryProps {
    isOpen: boolean; // ✅ NEW: Nhận prop isOpen
    onClose: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function InventoryView({ isOpen, onClose, showToast }: InventoryProps) {
  const { playUi } = useGameSound();

  // Lấy state và actions từ store (Tách lẻ để tránh re-render loop)
  const inventory = useGameStore(state => state.inventory);
  const equippedDecor = useGameStore(state => state.equippedDecor);
  const catAction = useGameStore(state => state.catAction);

  // Lấy actions tĩnh, không gây re-render
  const { setEquippedDecor, useCoffee: storeUseCoffee } = useGameStore.getState();

  const isSleeping = catAction === 'SLEEP';

  // ✅ 1. LOGIC LẤY ITEM SỞ HỮU
  const ownedDecorItems = useMemo(() =>
    ALL_DECOR_ITEMS.filter(item => (inventory[item.id] || 0) > 0),
    [inventory]
  );

  const ownedConsumableItems = useMemo(() =>
    Object.keys(inventory)
      .map(id => ITEM_DATA[id])
      .filter(itemData => itemData && inventory[itemData.id] > 0 && itemData.category === 'consumable'),
    [inventory]
  );
  const isBagEmpty = ownedDecorItems.length === 0 && ownedConsumableItems.length === 0;

  // ✅ 2. LOGIC XỬ LÝ (Handle Action)
  const handleEquip = (item: DecorItemData) => {
    playUi();
    const itemIdWithoutPrefix = item.id.replace(`${item.type}_`, '');
    setEquippedDecor(item.type, itemIdWithoutPrefix);
    showToast(`Equipped ${item.name}! ✨`);
  };

  const handleUnequip = (item: DecorItemData) => {
    playUi();
    setEquippedDecor(item.type, null);
    showToast(`Unequipped ${item.name}.`);
  };

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
            <div className="overflow-y-auto pb-24 pr-2 flex-1">
              {isBagEmpty ? (
                // ✅ 4. XỬ LÝ EMPTY STATE
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <p className="text-lg font-bold">Your backpack is empty.</p>
                  <p className="text-sm">Go to the shop to get some items!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Section Decor */}
                  <DecorSection
                    items={ownedDecorItems}
                    equippedItems={equippedDecor}
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                  />
                  {/* Section Consumables */}
                  <ConsumableSection
                    items={ownedConsumableItems}
                    inventory={inventory}
                    onItemClick={(item) => {
                      if (item.id === 'coffee' && isSleeping) {
                        playUi();
                        storeUseCoffee();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
interface DecorSectionProps {
  items: DecorItemData[];
  equippedItems: Record<DecorType, string | null>;
  onEquip: (item: DecorItemData) => void;
  onUnequip: (item: DecorItemData) => void;
}

function DecorSection({ items, equippedItems, onEquip, onUnequip }: DecorSectionProps) {

  if (items.length === 0) {
    return null; // Ẩn section nếu không có item
  }

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Decorations</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {items.map(item => {
          // ✅ 2. LOGIC KIỂM TRA "ĐANG TRANG BỊ"
          const itemIdWithoutPrefix = item.id.replace(`${item.type}_`, '');
          const isEquipped = equippedItems[item.type] === itemIdWithoutPrefix; // Sửa logic check
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isEquipped && onEquip(item)}
              className={`relative aspect-square bg-white/5 border rounded-2xl p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
                ${isEquipped ? 'border-game-primary shadow-lg shadow-game-primary/20' : 'border-white/10 cursor-pointer'}
              `}
            >
              <div className="w-12 h-12 flex-grow flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-lg" />
              </div>
              <span className="text-[10px] text-white font-bold text-center leading-tight">{item.name}</span>
              
              {/* ✅ 1. SỬA UI THẺ ITEM: Nút Unequip */}
              {isEquipped && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn event click của thẻ cha
                    onUnequip(item);
                  }}
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[85%] bg-slate-700/80 hover:bg-red-500/80 backdrop-blur-sm text-white text-[10px] font-bold py-1 rounded-md transition-all"
                >
                  Unequip
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface ConsumableSectionProps {
  items: ItemData[];
  inventory: Record<string, number>;
  onItemClick: (item: ItemData) => void;
}

function ConsumableSection({ items, inventory, onItemClick }: ConsumableSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Consumables</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {items.map(item => {
          const quantity = inventory[item.id];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onItemClick(item)}
              className="relative aspect-square bg-white/5 border border-white/10 rounded-2xl p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <div className="w-12 h-12 flex-grow flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imgSrc} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-lg" />
              </div>
              <span className="text-[10px] text-white font-bold text-center leading-tight">{item.name}</span>
              <div className="absolute bottom-1 right-2 text-sm font-black text-white/20">x{quantity}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}