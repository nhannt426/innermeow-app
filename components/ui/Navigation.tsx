'use client';

import Image from 'next/image'; // Dùng Image thay vì Icon vector
import clsx from 'clsx';

// Định nghĩa đường dẫn ảnh
const tabs = [
  { id: 'home', img: '/assets/icons/home-3d.png', label: 'Home' },
  { id: 'shop', img: '/assets/icons/shop-3d.png', label: 'Shop' },
  { id: 'travel', img: '/assets/icons/travel-3d.png', label: 'Travel' },
  { id: 'profile', img: '/assets/icons/profile-3d.png', label: 'Me' },
];

export default function Navigation({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-md">
      {/* Background mờ + Bo tròn cực mạnh */}
      <div className="flex justify-between items-center bg-[#1a1b26]/80 backdrop-blur-xl border border-white/10 rounded-[35px] px-6 py-4 shadow-2xl shadow-purple-900/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-16"
            >
              {/* Hiệu ứng nền sáng lên khi Active */}
              {isActive && (
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
              )}

              {/* Ảnh 3D: Active thì to ra, Inactive thì nhỏ và mờ hơn */}
              <div className={clsx(
                "transition-all duration-300 ease-spring", 
                isActive ? "transform -translate-y-4 scale-125 drop-shadow-lg" : "opacity-60 grayscale-[0.5] scale-100 hover:opacity-100 hover:scale-110"
              )}>
                <Image 
                  src={tab.img} 
                  alt={tab.label} 
                  width={48} // Icon 3D phải to hơn icon vector mới rõ chi tiết
                  height={48} 
                  className="object-contain"
                />
              </div>

              {/* Dấu chấm tròn báo hiệu Active (Thay vì chữ text rườm rà) */}
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