'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image'; // <--- Quan trọng: Import Image
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Settings } from 'lucide-react'; // Bỏ Star, Heart vector đi

// --- CONFIG ---
const MAX_HAPPINESS = 20;

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

  // States
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);
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

    // Spawn Bubbles Loop
    const bubbleInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && Math.random() > 0.6) {
        spawnBubble();
      }
    }, 4000);
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
    if (bubbles.length >= 6) return;
    const newBubble = {
      id: Date.now(),
      x: 15 + Math.random() * 70, 
      y: 25 + Math.random() * 40
    };
    setBubbles(prev => [...prev, newBubble]);
  };

  // --- ACTIONS ---
  const handlePet = (e: any) => {
    if (isSleeping) {
       webAppRef.current?.HapticFeedback.notificationOccurred('warning');
       return;
    }

    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => prev + 1);
      webAppRef.current?.HapticFeedback.impactOccurred('light');
      const { clientX, clientY } = e.touches ? e.touches[0] : e;
      setClicks(prev => [...prev, { id: Date.now(), x: clientX, y: clientY }]);
    } 
    
    if (happiness + 1 >= MAX_HAPPINESS) {
      handleClaimGift();
    }
  };

  const handleClaimGift = () => {
    const reward = 150 + (userData?.click_level || 1) * 30;
    setCoins(prev => prev + reward);
    setHappiness(0);
    setIsSleeping(true);
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    if (userData) supabase.rpc('increment_coins', { row_id: userData.id, amount: reward });
    setTimeout(() => setIsSleeping(false), 15000); 
  };

  const handleCollectBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setCoins(prev => prev + 30);
    webAppRef.current?.HapticFeedback.selectionChanged();
  };

  const handleUpgrade = async (type: 'click' | 'energy', cost: number) => {
     // Logic mua hàng (giữ nguyên logic cũ hoặc gọi RPC)
     if(coins >= cost) {
         setCoins(prev => prev - cost);
         // Demo UI update only
     }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shop') setIsShopOpen(true);
    else setIsShopOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* --- HEADER (3D VISUAL) --- */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            {/* Khung chứa điểm số */}
            <div className="relative pl-12 pr-6 py-3 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                
                {/* 3D STAR ICON (Trồi ra ngoài) */}
                <div className="absolute -left-2 -top-2 w-16 h-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-float">
                    <Image 
                        src="/assets/icons/star-3d.png" 
                        alt="Star" 
                        fill 
                        className="object-contain"
                    />
                </div>

                <div className="flex flex-col items-start justify-center leading-none">
                    <span className="text-[10px] text-yellow-200/80 font-bold uppercase tracking-widest mb-1">Stars</span>
                    <span className="text-2xl font-black text-white tracking-wide drop-shadow-md">
                        {coins.toLocaleString()}
                    </span>
                </div>
            </div>
         </div>
         
         <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto hover:bg-white/10 active:scale-95 transition-all">
            <Settings size={22} className="text-white/80" />
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

      {/* --- HAPPINESS BAR (3D VISUAL) --- */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm">
            
            {/* 3D HEART ICON (Nằm bên trái thanh) */}
            <div className="absolute -left-1 -top-4 w-14 h-14 z-20 drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                 <Image 
                    src="/assets/icons/heart-3d.png" 
                    alt="Happiness" 
                    fill 
                    className={`object-contain transition-transform duration-300 ${isSleeping ? 'grayscale' : 'scale-100'}`}
                 />
            </div>

            {/* Thanh chứa */}
            <div className="w-full h-8 bg-[#12131c]/80 rounded-full border border-white/10 backdrop-blur-md overflow-hidden p-1 shadow-xl pl-12 relative">
                
                {/* Text chỉ số (Nằm giữa thanh) */}
                <div className="absolute inset-0 flex items-center justify-center z-10 text-xs font-bold text-white/90 drop-shadow-sm">
                    {isSleeping ? 'Sleeping (Zzz)...' : `${happiness} / ${MAX_HAPPINESS} Happiness`}
                </div>

                {/* Thanh tiến trình (Gradient Hồng) */}
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out 
                        ${isSleeping 
                            ? 'bg-slate-700/50' 
                            : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.6)]'
                        }`}
                    style={{ width: isSleeping ? '100%' : `${(happiness / MAX_HAPPINESS) * 100}%` }}
                />
            </div>
        </div>
      </div>

      {/* --- MODALS & NAV --- */}
      <ShopModal 
        isOpen={isShopOpen} onClose={() => { setIsShopOpen(false); setActiveTab('home'); }} 
        coins={coins} clickLevel={userData?.click_level || 1} energyLevel={userData?.energy_level || 1}
        onUpgrade={handleUpgrade}
      />
      
      {/* Truyền activeTab vào Navigation để xử lý icon 3D */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Loading */}
      {loading && <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-game-primary"/></div>}
    </div>
  );
}