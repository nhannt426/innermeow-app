'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { useGameSound } from '@/hooks/useGameSound'; // <--- Import Hook

const tabs = [
  { id: 'home', img: '/assets/icons/home-3d.png', label: 'Home' },
  { id: 'shop', img: '/assets/icons/shop-3d.png', label: 'Shop' },
  { id: 'travel', img: '/assets/icons/travel-3d.png', label: 'Travel' },
  { id: 'profile', img: '/assets/icons/profile-3d.png', label: 'Me' },
];

export default function Navigation({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  
  // Lấy âm thanh UI
  const { playUi } = useGameSound();

  const handleTabClick = (id: string) => {
    // 1. Phát tiếng Click
    playUi();
    // 2. Chuyển Tab
    onTabChange(id);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-md">
      <div className="flex justify-between items-center bg-[#1a1b26]/80 backdrop-blur-xl border border-white/10 rounded-[35px] px-6 py-4 shadow-2xl shadow-purple-900/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)} // <--- Dùng hàm mới có âm thanh
              className="relative flex flex-col items-center justify-center w-16 group" // Thêm group để hover effect
            >
              {/* Glow Effect */}
              {isActive && (
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
              )}

              {/* Icon 3D */}
              <div className={clsx(
                "transition-all duration-300 ease-spring", 
                isActive 
                  ? "transform -translate-y-4 scale-125 drop-shadow-lg" 
                  : "opacity-60 grayscale-[0.5] scale-100 group-hover:opacity-100 group-hover:scale-110" // Thêm hover scale
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={tab.img} 
                  alt={tab.label} 
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
              </div>

              {/* Dot Indicator */}
              {isActive && (
                <div className="absolute -bottom-2 w-1.5 h-1.5 bg-game-accent rounded-full shadow-[0_0_10px_#2dd4bf]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}