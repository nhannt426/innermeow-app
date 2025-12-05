'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export default function Home() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Check if running inside Telegram
    // We use a try-catch to prevent crashing in standard browsers
    try {
        if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
            setUserData(WebApp.initDataUnsafe.user);
            WebApp.expand(); // Auto expand to full screen
        }
    } catch (e) {
        console.log("Not in Telegram environment");
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="w-full max-w-md text-center space-y-6">
        
        {/* Logo / Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-widest uppercase text-purple-300">Inner Meow</h1>
          <p className="text-sm text-slate-400">Your Soul Sanctuary</p>
        </div>

        {/* Status Box */}
        <div className="p-6 border border-slate-700 rounded-2xl bg-slate-800/50 backdrop-blur-md shadow-xl">
          {userData ? (
            <div className="space-y-2 animate-pulse">
              <p className="text-emerald-400 text-sm font-semibold tracking-wider">● TELEGRAM CONNECTED</p>
              <p className="text-xl">Welcome, <span className="font-bold text-white">{userData.first_name}</span></p>
            </div>
          ) : (
            <div className="space-y-2">
               <p className="text-amber-400 text-sm font-semibold tracking-wider">● BROWSER MODE</p>
               <p className="text-slate-300">Open this link in Telegram to play.</p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600">v1.0.0 - Initializing...</p>
      </div>
    </div>
  );
}