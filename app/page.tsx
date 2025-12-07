'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import { Loader2, Zap } from 'lucide-react'; // Thêm icon Zap (Năng lượng)

// --- CẤU HÌNH GAME ---
const MAX_ENERGY = 1000;
const ENERGY_REGEN_RATE = 1; // Hồi 1 năng lượng mỗi giây (Logic này làm sau, tạm thời để hiển thị)

interface UserData {
  id: string; // Đổi sang string vì Supabase UUID là string
  telegram_id: number;
  first_name: string;
  coins: number;
  energy: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State UI
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, value: number}[]>([]);
  
  // Refs
  const unsavedCoinsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webAppRef = useRef<any>(null); // Lưu ref WebApp để gọi Haptic

  // --- INIT ---
  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined') {
        try {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp; // Lưu lại dùng sau
          
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#0f172a');
            await fetchUserData(WebApp.initDataUnsafe.user.id);
          } else {
             setLoading(false);
          }
        } catch (e) {
          console.error("SDK Error", e);
        }
      }
    };
    initApp();
  }, []);

  const fetchUserData = async (telegramId: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
    if (data) {
      setUserData(data);
      // setEnergy(data.energy); // Sau này sẽ lấy energy thật từ DB
    }
    setLoading(false);
  };

  // --- CORE TAP LOGIC ---
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // 1. Check điều kiện: Còn năng lượng không?
    if (energy <= 0) {
        // Rung kiểu báo lỗi (Notification Error)
        webAppRef.current?.HapticFeedback.notificationOccurred('error');
        return; 
    }

    // 2. Kích hoạt Rung (Haptic - Medium Impact) -> SƯỚNG TAY LÀ Ở ĐÂY
    if (webAppRef.current) {
        webAppRef.current.HapticFeedback.impactOccurred('medium');
    }

    // 3. Tính toán vị trí hiện số
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // 4. Update UI ngay lập tức
    const newClick = { id: Date.now(), x: clientX, y: clientY, value: 1 };
    setClicks((prev) => [...prev, newClick]);
    setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== newClick.id)), 800);

    setUserData((prev) => prev ? { ...prev, coins: prev.coins + 1 } : null);
    setEnergy((prev) => Math.max(0, prev - 1)); // Trừ năng lượng

    // 5. Logic Sync Server (RPC)
    unsavedCoinsRef.current += 1;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (unsavedCoinsRef.current > 0 && userData) {
        const amount = unsavedCoinsRef.current;
        unsavedCoinsRef.current = 0;
        
        // Gọi hàm RPC `increment_coins` thay vì update thẳng
        await supabase.rpc('increment_coins', { 
            row_id: userData.id, 
            amount: amount 
        });
        
        console.log(`Synced +${amount} coins`);
      }
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      
      {/* Header Info */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-50 pointer-events-none">
         <div className="flex flex-col space-y-2 pointer-events-auto">
            {/* Coin Badge */}
            <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/20 text-xl animate-bounce-slow">
                    🪙
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Balance</span>
                    <span className="text-2xl font-black text-white leading-none">
                        {userData?.coins.toLocaleString() || 0}
                    </span>
                </div>
            </div>
         </div>
      </header>

      {/* Main Game */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && <RoomScene onTap={handleTap} />}
      </main>

      {/* Energy Bar (Nằm trên thanh điều hướng) */}
      <div className="fixed bottom-28 left-6 right-6 z-40">
        <div className="flex justify-between text-xs font-bold mb-1 text-slate-300">
            <div className="flex items-center"><Zap size={14} className="text-yellow-400 mr-1"/> Energy</div>
            <div>{energy} / {MAX_ENERGY}</div>
        </div>
        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
            <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${(energy / MAX_ENERGY) * 100}%` }}
            />
        </div>
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}