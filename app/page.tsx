'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Settings, Heart, Star } from 'lucide-react';

// --- CONFIG ---
const MAX_HAPPINESS = 20; // Vuốt 20 cái là đầy

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;
  energy_level: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GAMEPLAY STATES ---
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0); // 0 -> 20
  const [isSleeping, setIsSleeping] = useState(false);
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  // Effects
  const [clicks, setClicks] = useState<any[]>([]);
  const webAppRef = useRef<any>(null);

  // --- INIT ---
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready(); WebApp.expand(); WebApp.setHeaderColor('#1a1b26');
            fetchData(WebApp.initDataUnsafe.user.id);
          } else setLoading(false);
        }
      } catch (e) { setLoading(false); }
    };
    init();

    // Spawn Bubbles giả lập (Cứ 5s mọc 1 cái để test)
    const bubbleInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && Math.random() > 0.5) {
        spawnBubble();
      }
    }, 5000);
    return () => clearInterval(bubbleInterval);
  }, []);

  const fetchData = async (tid: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    if (data) {
      setUserData(data);
      setCoins(data.coins);
    }
    setLoading(false);
  };

  const spawnBubble = () => {
    if (bubbles.length >= 5) return; // Max 5 bóng
    const newBubble = {
      id: Date.now(),
      x: 20 + Math.random() * 60, // Random vị trí X (20% - 80%)
      y: 30 + Math.random() * 40  // Random vị trí Y (30% - 70%)
    };
    setBubbles(prev => [...prev, newBubble]);
  };

  // --- ACTIONS ---

  // 1. Vuốt Mèo
  const handlePet = (e: any) => {
    if (isSleeping) {
       webAppRef.current?.HapticFeedback.notificationOccurred('warning');
       return;
    }

    // Tăng Happy
    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => prev + 1);
      webAppRef.current?.HapticFeedback.impactOccurred('light');
      
      // Visual Heart
      const { clientX, clientY } = e.touches ? e.touches[0] : e;
      const newClick = { id: Date.now(), x: clientX, y: clientY };
      setClicks(prev => [...prev, newClick]);
      setTimeout(() => setClicks(prev => prev.filter(c => c.id !== newClick.id)), 1000);
    } 
    
    // Nếu đầy cây -> Nhận quà & Ngủ
    if (happiness + 1 >= MAX_HAPPINESS) {
      handleClaimGift();
    }
  };

  const handleClaimGift = () => {
    const reward = 100 + (userData?.click_level || 1) * 20; // Quà to
    setCoins(prev => prev + reward);
    setHappiness(0);
    setIsSleeping(true); // Mèo đi ngủ
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    
    // Sync to DB (Giả lập update)
    if (userData) {
        supabase.rpc('increment_coins', { row_id: userData.id, amount: reward });
    }

    // Tỉnh dậy sau 10 giây (Demo)
    setTimeout(() => setIsSleeping(false), 10000); 
  };

  // 2. Thu hoạch Bong bóng
  const handleCollectBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setCoins(prev => prev + 25); // +25 stars mỗi bóng
    webAppRef.current?.HapticFeedback.selectionChanged();
  };

  // 3. Mua đồ
  const handleUpgrade = async (type: 'click' | 'energy', cost: number) => {
    if(coins < cost) return;
    setCoins(prev => prev - cost);
    // Gọi RPC (bạn tự tích hợp lại code cũ nhé, đây là UI demo)
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
  };

  // 4. Navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shop') setIsShopOpen(true);
    else setIsShopOpen(false); // Tự đóng Shop khi chuyển tab khác
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* --- HEADER --- */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            {/* Stars/Coins Badge */}
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                <Star size={20} className="text-yellow-400 fill-yellow-400 animate-pulse-slow" />
                <span className="text-xl font-black text-white tracking-wide">{coins.toLocaleString()}</span>
            </div>
         </div>
         <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto">
            <Settings size={20} className="text-white/70" />
         </button>
      </header>

      {/* --- MAIN SCENE --- */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene 
             onPet={handlePet} 
             isSleeping={isSleeping}
             bubbles={bubbles}
             onCollectBubble={handleCollectBubble}
           />
        )}
      </main>

      {/* --- HAPPINESS BAR --- */}
      <div className="fixed bottom-28 left-8 right-8 z-30 pointer-events-none">
        <div className="flex justify-between text-xs font-bold mb-2 px-1 text-pink-200">
            <span className="flex items-center gap-1"><Heart size={12} className="fill-pink-400 text-pink-400"/> Happiness</span>
            <span>{isSleeping ? 'Sleeping...' : `${happiness} / ${MAX_HAPPINESS}`}</span>
        </div>
        <div className="w-full h-5 bg-black/40 rounded-full p-1 border border-white/5 backdrop-blur-sm">
            <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${isSleeping ? 'bg-slate-600' : 'bg-gradient-to-r from-pink-500 to-rose-400 shadow-[0_0_15px_rgba(244,114,182,0.6)]'}`}
                style={{ width: isSleeping ? '100%' : `${(happiness / MAX_HAPPINESS) * 100}%` }}
            />
        </div>
      </div>

      {/* --- MODALS & NAV --- */}
      <ShopModal 
        isOpen={isShopOpen} onClose={() => { setIsShopOpen(false); setActiveTab('home'); }} 
        coins={coins} clickLevel={userData?.click_level || 1} energyLevel={userData?.energy_level || 1}
        onUpgrade={handleUpgrade}
      />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Loading */}
      {loading && <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-game-primary"/></div>}
    </div>
  );
}