'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects'; // Import mới
import { Loader2, Settings } from 'lucide-react';

interface UserData {
  id: number;
  first_name: string;
  coins: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- STATE CHO TAP EFFECT ---
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, value: number}[]>([]);
  const unsavedCoinsRef = useRef(0); // Biến lưu tạm số coin chưa save
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined') {
        try {
          const WebApp = (await import('@twa-dev/sdk')).default;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#0f172a');
            await fetchUserData(WebApp.initDataUnsafe.user.id);
          } else {
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

  const fetchUserData = async (telegramId: number) => {
    try {
      const { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      if (data) setUserData(data);
    } finally {
      setLoading(false);
    }
  };

  // --- CORE GAME LOOP: TAP HANDLING ---
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!userData) return;

    // 1. Xác định vị trí tap để hiện số
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // 2. Thêm hiệu ứng bay số
    const newClick = { id: Date.now(), x: clientX, y: clientY, value: 1 };
    setClicks((prev) => [...prev, newClick]);
    
    // Xóa hiệu ứng sau 1 giây để nhẹ máy
    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
    }, 1000);

    // 3. Cập nhật UI ngay lập tức (Optimistic UI)
    setUserData((prev) => prev ? { ...prev, coins: prev.coins + 1 } : null);

    // 4. Logic Debounce Save (Lưu vào DB sau 2 giây ngừng tap)
    unsavedCoinsRef.current += 1;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (unsavedCoinsRef.current > 0 && userData) {
        const amountToAdd = unsavedCoinsRef.current;
        unsavedCoinsRef.current = 0; // Reset biến tạm
        
        // Gọi Supabase cập nhật (Cộng dồn vào DB)
        // Lưu ý: Cách chuẩn là dùng RPC (Store Procedure) để tránh Race Condition, 
        // nhưng ở đây ta dùng update đơn giản cho dễ hiểu trước.
        await supabase
          .from('users')
          .update({ coins: userData.coins + amountToAdd }) // Lưu số coin mới nhất từ State
          .eq('id', userData.id);
          
        console.log(`Saved +${amountToAdd} coins to DB`);
      }
    }, 2000); // Sau 2 giây không bấm nữa thì mới lưu
  };

  // --- RENDER CONTENT ---
  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden font-sans select-none touch-none">
      {/* Click Effects Layer */}
      <ClickEffects clicks={clicks} />

      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col space-y-1 pointer-events-auto">
          <h1 className="text-sm font-light tracking-[0.2em] text-white/60 uppercase">Inner Meow</h1>
          <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-xl pl-2 pr-4 py-1.5 rounded-full border border-white/10 w-fit transition-all">
             <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center text-xs">🪙</div>
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-bold text-sm text-yellow-100">{userData?.coins || 0}</span>}
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 pointer-events-auto">
          <Settings size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' ? (
           <RoomScene onTap={handleTap} />
        ) : (
           <div className="flex items-center justify-center h-full text-slate-500">Feature Coming Soon</div>
        )}
      </main>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}