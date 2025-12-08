'use client';

import clsx from 'clsx';
import { useGameSound } from '@/hooks/useGameSound';

const tabs = [
  { id: 'home', img: '/assets/icons/home-3d.webp', label: 'Home' },
  { id: 'shop', img: '/assets/icons/shop-3d.webp', label: 'Shop' },
  { id: 'travel', img: '/assets/icons/earth-3d.webp', label: 'World' },
  { id: 'inventory', img: '/assets/icons/bag-3d.webp', label: 'Bag' }, 
  { id: 'profile', img: '/assets/icons/profile-3d.webp', label: 'Me' },
];

interface NavigationProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    hasNotification?: boolean; // ✅ NEW: Prop để hiện chấm đỏ
}

export default function Navigation({ activeTab, onTabChange, hasNotification }: NavigationProps) {
  const { playUi } = useGameSound();

  const handleTabClick = (id: string) => {
    playUi();
    onTabChange(id);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-md">
      {/* Sửa lại padding px-4 để chứa đủ 5 icon mà không bị chật */}
      <div className="flex justify-between items-center bg-[#1a1b26]/90 backdrop-blur-xl border border-white/10 rounded-[35px] px-4 py-4 shadow-2xl shadow-purple-900/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          // Nếu là Travel mode (đang chơi game) thì vẫn highlight tab Travel
          // Logic này xử lý bên GameClient truyền xuống activeTab='travel'
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              // Giảm chiều rộng w-14 để vừa 5 nút
              className="relative flex flex-col items-center justify-center w-14 group"
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
              )}

              <div className={clsx(
                "transition-all duration-300 ease-spring relative", 
                isActive 
                  ? "transform -translate-y-4 scale-125 drop-shadow-lg" 
                  : "opacity-60 grayscale-[0.5] scale-100 group-hover:opacity-100 group-hover:scale-110"
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tab.img} alt={tab.label} className="w-10 h-10 object-contain" draggable={false}/> {/* Giảm size icon chút xíu từ w-12 xuống w-10 */}
                
                {/* Chấm đỏ Inventory */}
                {tab.id === 'inventory' && hasNotification && !isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1a1b26] animate-bounce" />
                )}
              </div>

              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-game-accent rounded-full shadow-[0_0_10px_#2dd4bf]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}