'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import { Loader2, Zap, Gem } from 'lucide-react'; // Dùng icon Gem cho Coin nhìn sang hơn

const MAX_ENERGY = 500; // Giả sử max là 500

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  energy: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State Optimistic (Hiển thị ngay cho mượt)
  const [localCoins, setLocalCoins] = useState(0);
  const [localEnergy, setLocalEnergy] = useState(0);
  
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, value: number}[]>([]);
  
  // Refs sync
  const pendingUpdatesRef = useRef({ coins: 0, energy: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webAppRef = useRef<any>(null);

  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined') {
        try {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#1a1b26'); // Trùng màu game-bg
            await fetchUserData(WebApp.initDataUnsafe.user.id);
          } else {
             setLoading(false);
          }
        } catch (e) { console.error(e); }
      }
    };
    initApp();
  }, []);

  const fetchUserData = async (telegramId: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
    if (data) {
      setUserData(data);
      setLocalCoins(data.coins);
      setLocalEnergy(data.energy);
    }
    setLoading(false);
  };

  // --- TAP LOGIC ---
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (localEnergy <= 0) {
        webAppRef.current?.HapticFeedback.notificationOccurred('error');
        return; 
    }

    // 1. Haptic
    webAppRef.current?.HapticFeedback.impactOccurred('medium');

    // 2. Position
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // 3. UI Updates
    const newClick = { id: Date.now(), x: clientX, y: clientY, value: 1 };
    setClicks((prev) => [...prev, newClick]);
    setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== newClick.id)), 800);

    // Cập nhật State cục bộ ngay lập tức
    setLocalCoins(prev => prev + 1);
    setLocalEnergy(prev => Math.max(0, prev - 1));

    // 4. Sync Logic (Debounce)
    pendingUpdatesRef.current.coins += 1;
    pendingUpdatesRef.current.energy += 1; // Số năng lượng tiêu thụ

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (userData && pendingUpdatesRef.current.coins > 0) {
        const payload = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = { coins: 0, energy: 0 }; // Reset
        
        // Gọi hàm SQL mới: tap_gameplay
        await supabase.rpc('tap_gameplay', { 
            p_user_id: userData.id, 
            p_coins_add: payload.coins,
            p_energy_consume: payload.energy
        });
        console.log("Synced to DB:", payload);
      }
    }, 1500); // Sync sau 1.5s
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* Glow Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-game-primary/20 rounded-full blur-[120px]" />
      
      {/* HEADER */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-50 pointer-events-none">
         <div className="flex flex-col space-y-2 pointer-events-auto">
            <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/5">
                {/* Icon Coin 3D hơn */}
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                    <Gem size={20} className="text-white drop-shadow-md" />
                </div>
                <div className="flex flex-col pr-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Soul Shards</span>
                    <span className="text-xl font-black text-white leading-none tracking-wide">
                        {localCoins.toLocaleString()}
                    </span>
                </div>
            </div>
         </div>
      </header>

      {/* MAIN GAME */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && <RoomScene onTap={handleTap} />}
      </main>

      {/* THANH NĂNG LƯỢNG (Chuẩn style mới) */}
      <div className="fixed bottom-28 left-6 right-6 z-40 pointer-events-none">
        <div className="flex justify-between text-xs font-bold mb-1.5 px-1">
            <div className="flex items-center text-game-accent"><Zap size={14} className="mr-1 fill-game-accent"/> Energy</div>
            <div className="text-slate-400">{localEnergy} / {MAX_ENERGY}</div>
        </div>
        <div className="w-full h-4 bg-black/40 rounded-full p-0.5 border border-white/5 backdrop-blur-sm">
            <div 
                className="h-full bg-game-accent rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${(localEnergy / MAX_ENERGY) * 100}%` }}
            />
        </div>
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}