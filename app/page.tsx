'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import { Loader2, Settings } from 'lucide-react';

// Define User Interface
interface UserData {
  id: number;
  first_name: string;
  coins: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Dynamic Import SDK
          const WebApp = (await import('@twa-dev/sdk')).default;
          
          // Check if running in Telegram
          if (WebApp.initDataUnsafe.user) {
            setIsTelegram(true);
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#0f172a'); // Match background color

            const teleUser = WebApp.initDataUnsafe.user;
            await fetchUserData(teleUser.id);
          } else {
             // Fallback for browser testing (remove in production if needed)
             setLoading(false);
          }
        } catch (e) {
          console.error("SDK Init Error:", e);
          setLoading(false);
        }
      }
    };
    initApp();
  }, []);

  // --- DATA FETCHING ---
  const fetchUserData = async (telegramId: number) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error("Database Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT BASED ON TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <RoomScene />;
      case 'brew':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md">
              <span className="text-2xl">🍵</span>
            </div>
            <p>Emotion Tea Brewing</p>
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">Coming Soon</span>
          </div>
        );
      case 'travel':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md">
              <span className="text-2xl">🎒</span>
            </div>
            <p>Dream Expeditions</p>
            <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">Coming Soon</span>
          </div>
        );
      case 'profile':
        return (
           <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md">
              <span className="text-2xl">👤</span>
            </div>
            <p>My Profile</p>
            {userData && <p className="text-white font-bold text-lg">{userData.first_name}</p>}
          </div>
        );
      default:
        return <RoomScene />;
    }
  };

  // --- MAIN RENDER ---
  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden font-sans select-none">
      
      {/* 1. Background Ambience (Blur Blobs) */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. Top Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50">
        <div className="flex flex-col space-y-1">
          <h1 className="text-sm font-light tracking-[0.2em] text-white/60 uppercase">Inner Meow</h1>
          
          {/* Coin Display with Loading State */}
          <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-xl pl-2 pr-4 py-1.5 rounded-full border border-white/10 w-fit transition-all hover:bg-white/10">
             <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center text-xs">🪙</div>
             {loading ? (
               <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
             ) : (
               <span className="font-bold text-sm text-yellow-100">{userData?.coins || 0}</span>
             )}
          </div>
        </div>
        
        <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </header>

      {/* 3. Main Content Area */}
      <main className="relative z-10 w-full h-screen pt-10">
        {renderContent()}
      </main>

      {/* 4. Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
    </div>
  );
}