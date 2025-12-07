'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Settings } from 'lucide-react';

// --- CONFIG ---
const MAX_HAPPINESS = 10; // Giảm xuống 10 vì hold khó hơn tap
const BUBBLE_GEN_RATE_MS = 10000; // Demo: 10 giây 1 bóng (Thực tế nên để 30 phút)
const SLEEP_DURATION_MS = 60000; // Demo: Ngủ 1 phút

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number; // Affection Level
  energy_level: number; // Mind Space Level (Max Bubbles)
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);
  
  // Sleep Logic
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  // Bubble Logic
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());

  const [clicks, setClicks] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const webAppRef = useRef<any>(null);

  // Tính Max Bubble dựa trên Level (Level 1 = 3 bóng)
  const maxBubbles = userData ? 2 + userData.energy_level : 3;

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

    // Loop kiểm tra logic game (mỗi 1 giây)
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // 1. Check Sleep
      if (sleepUntil && now >= sleepUntil) {
        setSleepUntil(null); // Tỉnh dậy
        webAppRef.current?.HapticFeedback.notificationOccurred('success');
      }

      // 2. Spawn Bubble (Dựa trên thời gian)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (prev.length >= maxBubbles) return prev; // Đầy kho thì không sinh nữa
          const newBubble = {
            id: Date.now(),
            x: 15 + Math.random() * 70, 
            y: 20 + Math.random() * 40
          };
          lastBubbleTimeRef.current = now; // Reset timer
          return [...prev, newBubble];
        });
      }
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [maxBubbles, sleepUntil]); // Dependency quan trọng

  const fetchData = async (tid: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    if (data) {
      setUserData(data);
      setCoins(data.coins);
    }
    setLoading(false);
  };

  // --- ACTIONS ---

  // 1. Perfect Sync (Vuốt thành công)
  const handlePetSuccess = () => {
    if (isSleeping) return;

    // Hiệu ứng Visual
    webAppRef.current?.HapticFeedback.impactOccurred('heavy'); // Rung mạnh
    setClicks(prev => [...prev, { id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]); // Tim bay giữa màn hình

    // Logic Game
    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => prev + 1);
    } 
    
    // Đầy cây -> Nhận quà
    if (happiness + 1 >= MAX_HAPPINESS) {
      const reward = 200 + (userData?.click_level || 1) * 50;
      setCoins(prev => prev + reward);
      setHappiness(0);
      setSleepUntil(Date.now() + SLEEP_DURATION_MS); // Ngủ 1 phút
      
      webAppRef.current?.HapticFeedback.notificationOccurred('success');
      // TODO: Call Supabase update coins & sleep_until
    }
  };

  const handleCollectBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setCoins(prev => prev + 30);
    webAppRef.current?.HapticFeedback.selectionChanged();
  };

  const handleUpgrade = async (type: 'click' | 'energy', cost: number) => {
     if(coins >= cost) {
         setCoins(prev => prev - cost);
         setUserData(prev => {
             if(!prev) return null;
             return {
                 ...prev,
                 click_level: type === 'click' ? prev.click_level + 1 : prev.click_level,
                 energy_level: type === 'energy' ? prev.energy_level + 1 : prev.energy_level
             }
         });
         // TODO: Call Supabase RPC
         webAppRef.current?.HapticFeedback.notificationOccurred('success');
     }
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* HEADER */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="relative pl-12 pr-6 py-3 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <div className="absolute -left-2 -top-2 w-16 h-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-float">
                    <Image src="/assets/icons/star-3d.png" alt="Star" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start justify-center leading-none">
                    <span className="text-[10px] text-yellow-200/80 font-bold uppercase tracking-widest mb-1">Stars</span>
                    <span className="text-2xl font-black text-white tracking-wide drop-shadow-md">{coins.toLocaleString()}</span>
                </div>
            </div>
         </div>
         <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto hover:bg-white/10">
            <Settings size={22} className="text-white/80" />
         </button>
      </header>

      {/* MAIN SCENE */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene 
             onPetSuccess={handlePetSuccess} 
             isSleeping={isSleeping}
             sleepUntil={sleepUntil}
             bubbles={bubbles}
             onCollectBubble={handleCollectBubble}
           />
        )}
      </main>

      {/* HAPPINESS BAR */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm transition-all duration-500" style={{ opacity: isSleeping ? 0.5 : 1 }}>
            <div className="absolute -left-1 -top-4 w-14 h-14 z-20 drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                 <Image src="/assets/icons/heart-3d.png" alt="Happiness" fill className={`object-contain transition-transform ${isSleeping ? 'grayscale' : ''}`} />
            </div>
            <div className="w-full h-8 bg-[#12131c]/80 rounded-full border border-white/10 backdrop-blur-md overflow-hidden p-1 shadow-xl pl-12 relative">
                <div className="absolute inset-0 flex items-center justify-center z-10 text-xs font-bold text-white/90 drop-shadow-sm">
                    {isSleeping ? 'Sleeping...' : `${happiness} / ${MAX_HAPPINESS} Happiness`}
                </div>
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isSleeping ? 'bg-slate-600' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.6)]'}`}
                    style={{ width: isSleeping ? '0%' : `${(happiness / MAX_HAPPINESS) * 100}%` }}
                />
            </div>
        </div>
      </div>

      <ShopModal isOpen={isShopOpen} onClose={() => { setIsShopOpen(false); setActiveTab('home'); }} coins={coins} clickLevel={userData?.click_level || 1} energyLevel={userData?.energy_level || 1} onUpgrade={handleUpgrade} />
      <Navigation activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); if(tab==='shop') setIsShopOpen(true); else setIsShopOpen(false); }} />
      {loading && <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-game-primary"/></div>}
    </div>
  );
}