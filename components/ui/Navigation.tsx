'use client';

import { Home, ShoppingBag, Map, User } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'shop', icon: ShoppingBag, label: 'Shop' }, // Đã đổi tên
  { id: 'travel', icon: Map, label: 'Travel' },
  { id: 'profile', icon: User, label: 'Me' },
];

export default function Navigation({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-[30px] p-2 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "flex flex-col items-center justify-center w-16 h-16 rounded-[24px] transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-game-primary to-indigo-600 text-white shadow-lg shadow-purple-500/30 translate-y-[-12px]" 
                  : "text-slate-500 hover:text-slate-200"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="text-[10px] font-bold mt-1 tracking-wide">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}