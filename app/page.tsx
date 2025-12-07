'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client'; // Import đúng (không dùng createClient)
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Zap, Gem, Settings } from 'lucide-react';

// --- CONFIG ---
const BASE_MAX_ENERGY = 500;

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  energy: number;
  click_level: number;
  energy_level: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Quan trọng: Logic Loading
  const [loading, setLoading] = useState(true);
  
  // Local UI States
  const [localCoins, setLocalCoins] = useState(0);
  const [localEnergy, setLocalEnergy] = useState(0);
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, value: number}[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Refs
  const pendingUpdatesRef = useRef({ coins: 0, energy: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webAppRef = useRef<any>(null);

  // Derived Values (Tính toán dựa trên dữ liệu thật)
  const clickPower = userData ? userData.click_level : 1;
  const maxEnergy = userData ? userData.energy_level * 500 : 500;

  useEffect(() => {
    const initApp = async () => {
      // Dù có lỗi hay không, cuối cùng cũng phải tắt loading để không bị treo
      try {
        if (typeof window !== 'undefined') {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#1a1b26');
            await fetchUserData(WebApp.initDataUnsafe.user.id);
          } else {
            console.log("Running in browser mode");
            setLoading(false); // Browser mode -> Tắt loading
          }
        }
      } catch (e) {
        console.error("Init Error:", e);
        setLoading(false); // Lỗi -> Tắt loading
      }
    };
    initApp();
  }, []);

  const fetchUserData = async (telegramId: number) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      
      if (error) throw error;
      
      if (data) {
        setUserData(data);
        setLocalCoins(data.coins);
        setLocalEnergy(data.energy);
      }
    } catch (err) {
      console.error("Fetch User Error:", err);
    } finally {
      setLoading(false); // Luôn tắt loading khi fetch xong
    }
  };

  // --- MUA UPGRADE (LOGIC MỚI) ---
  const handleUpgrade = async (type: 'click' | 'energy', cost: number) => {
    if (!userData) return;

    // 1. Gọi RPC Server (Chờ kết quả thật)
    const { data, error } = await supabase.rpc('buy_upgrade', {
        p_user_id: userData.id,
        p_type: type
    });

    if (error) {
        console.error("RPC Error:", error);
        webAppRef.current?.HapticFeedback.notificationOccurred('error');
        return;
    }

    // 2. Kiểm tra kết quả trả về từ SQL JSON
    // data = { success: true, new_level: 5, coins_left: 100... }
    if (data && data.success) {
        webAppRef.current?.HapticFeedback.notificationOccurred('success');
        
        // Cập nhật State với dữ liệu mới từ Server trả về
        setUserData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                coins: data.coins_left,
                click_level: type === 'click' ? data.new_level : prev.click_level,
                energy_level: type === 'energy' ? data.new_level : prev.energy_level
            };
        });
        
        // Cập nhật UI ngay
        setLocalCoins(data.coins_left);
        // Nếu nâng cấp Energy, server tự hồi đầy -> Cập nhật luôn
        if (type === 'energy') {
           setLocalEnergy(data.new_level * 500);
        }

    } else {
        // Trường hợp không đủ tiền hoặc lỗi logic
        console.log("Upgrade failed:", data?.message);
        webAppRef.current?.HapticFeedback.notificationOccurred('warning');
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (localEnergy <= 0) {
        webAppRef.current?.HapticFeedback.notificationOccurred('error');
        return; 
    }

    webAppRef.current?.HapticFeedback.impactOccurred('medium');

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const newClick = { id: Date.now(), x: clientX, y: clientY, value: clickPower };
    setClicks((prev) => [...prev, newClick]);
    setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== newClick.id)), 800);

    setLocalCoins(prev => prev + clickPower);
    setLocalEnergy(prev => Math.max(0, prev - 1));

    pendingUpdatesRef.current.coins += clickPower;
    pendingUpdatesRef.current.energy += 1;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (userData && pendingUpdatesRef.current.coins > 0) {
        const payload = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = { coins: 0, energy: 0 };
        
        await supabase.rpc('tap_gameplay', { 
            p_user_id: userData.id, 
            p_coins_add: payload.coins,
            p_energy_consume: payload.energy
        });
      }
    }, 1500);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'brew') setIsShopOpen(true);
    else setActiveTab(tab);
  }

  // --- RENDER ---
  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
        coins={localCoins}
        clickLevel={userData?.click_level || 1}
        energyLevel={userData?.energy_level || 1}
        onUpgrade={handleUpgrade}
      />

      {/* Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-game-primary/20 rounded-full blur-[120px]" />
      
      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col space-y-2 pointer-events-auto">
            <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/5">
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
         {/* Settings Button */}
         <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto hover:bg-white/10">
            <Settings size={20} className="text-white/70" />
         </button>
      </header>

      {/* Main Game */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene onTap={handleTap} />
        )}
      </main>

      {/* Energy Bar */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none">
        <div className="flex justify-between text-xs font-bold mb-1.5 px-1">
            <div className="flex items-center text-game-accent"><Zap size={14} className="mr-1 fill-game-accent"/> Energy</div>
            <div className="text-slate-400">{localEnergy} / {maxEnergy}</div>
        </div>
        <div className="w-full h-4 bg-black/40 rounded-full p-0.5 border border-white/5 backdrop-blur-sm">
            <div 
                className="h-full bg-game-accent rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${(localEnergy / maxEnergy) * 100}%` }}
            />
        </div>
      </div>

      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-game-bg z-[100] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-game-accent animate-spin" />
            <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">Initializing Sanctuary...</p>
        </div>
      )}
    </div>
  );
}