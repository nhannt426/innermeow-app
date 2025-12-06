'use client';

import { Home, Sparkles, Map, User } from 'lucide-react';
import clsx from 'clsx';

// Định nghĩa các tab
const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'brew', icon: Sparkles, label: 'Brew' },
  { id: 'travel', icon: Map, label: 'Travel' },
  { id: 'profile', icon: User, label: 'Me' },
];

export default function Navigation({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="flex justify-between items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 shadow-2xl ring-1 ring-black/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg translate-y-[-10px]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="text-[10px] font-medium mt-1">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}