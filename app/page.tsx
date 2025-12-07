'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Settings } from 'lucide-react';

// --- CẤU HÌNH GAME ---
const MAX_HAPPINESS = 10; // Thanh vui vẻ
const BUBBLE_GEN_RATE_MS = 5000; // Tạm để 5 giây sinh 1 bóng để bạn test (Thực tế nên để 30 phút)
const SLEEP_DURATION_MS = 60000; // Mèo ngủ 1 phút sau khi đầy Happiness

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;  // Dùng làm Level vật phẩm (Item Rarity)
  energy_level: number; // Dùng làm Sức chứa bong bóng (Max Bubbles)
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GAME STATES ---
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);
  
  // Sleep Logic
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  // Bubble Logic (Lưu trữ danh sách bong bóng đang bay)
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());

  // UI Effects
  const [clicks, setClicks] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const webAppRef = useRef<any>(null);

  // Tính Max Bubble dựa trên Level (Level 1 = 3 bóng, mỗi cấp thêm 1)
  const maxBubbles = userData ? 2 + userData.energy_level : 3;

  // --- KHỞI TẠO ---
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready(); 
            WebApp.expand(); 
            WebApp.setHeaderColor('#1a1b26');
            fetchData(WebApp.initDataUnsafe.user.id);
          } else {
            console.log("Browser mode detected");
            setLoading(false);
          }
        }
      } catch (e) { 
        console.error(e);
        setLoading(false); 
      }
    };
    init();

    // --- GAME LOOP (Chạy mỗi 1 giây) ---
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // 1. Kiểm tra Mèo dậy chưa
      if (sleepUntil && now >= sleepUntil) {
        setSleepUntil(null); // Tỉnh dậy
        webAppRef.current?.HapticFeedback.notificationOccurred('success');
      }

      // 2. Logic Sinh Bong Bóng (Spawn)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          // Nếu đầy kho hoặc Mèo đang ngủ thì không sinh thêm (để tránh rối)
          if (prev.length >= maxBubbles || isSleeping) return prev; 
          
          // --- LOGIC SPAWN RÌA MÀN HÌNH (Quan trọng) ---
          // Random chọn 1 trong 3 cạnh: 0=Trên, 1=Trái, 2=Phải
          const side = Math.floor(Math.random() * 3);
          let spawnX, spawnY;

          if (side === 0) { // Cạnh Trên (Tránh che đầu mèo)
             spawnX = 10 + Math.random() * 80; // 10% -> 90% chiều ngang
             spawnY = 10 + Math.random() * 10; // 10% -> 20% chiều dọc (Sát mép trên)
          } else if (side === 1) { // Cạnh Trái
             spawnX = 5 + Math.random() * 10;  // 5% -> 15% chiều ngang (Sát mép trái)
             spawnY = 20 + Math.random() * 50; // 20% -> 70% chiều dọc
          } else { // Cạnh Phải
             spawnX = 85 + Math.random() * 10; // 85% -> 95% chiều ngang (Sát mép phải)
             spawnY = 20 + Math.random() * 50; // 20% -> 70% chiều dọc
          }

          const newBubble = { id: now, x: spawnX, y: spawnY };
          lastBubbleTimeRef.current = now; // Reset timer
          return [...prev, newBubble];
        });
      }
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [maxBubbles, sleepUntil, isSleeping]);

  const fetchData = async (tid: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    if (data) {
      setUserData(data);
      setCoins(data.coins);
    }
    setLoading(false);
  };

  // --- PLAYER ACTIONS ---

  // 1. Xử lý khi Bong bóng bị chọc vỡ (Gọi từ RoomScene)
  const handlePopBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    webAppRef.current?.HapticFeedback.impactOccurred('light');
    // Lưu ý: Không cộng tiền ở đây nữa, tiền sẽ có khi cho mèo ăn item rớt ra
  };

  // 2. Xử lý khi Tương tác thành công (Mèo ăn/chơi xong)
  const handleInteractSuccess = (reward: number, type: string) => {
    if (isSleeping) return;

    // Hiệu ứng Visual
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    
    // Tạo tim bay giữa màn hình
    setClicks(prev => [...prev, { id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]);

    // Cộng tiền
    setCoins(prev => prev + reward);
    
    // Tăng Happiness (Item càng xịn tăng càng nhiều?)
    // Tạm thời cố định +1 hoặc +2
    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => Math.min(prev + 1, MAX_HAPPINESS));
    } 
    
    // Check nếu đầy Happiness -> Nhận quà to & Đi ngủ
    if (happiness + 1 >= MAX_HAPPINESS) {
      handleClaimBigGift();
    }
  };

  // 3. Nhận quà to khi đầy Happiness
  const handleClaimBigGift = () => {
    const levelBonus = (userData?.click_level || 1) * 50;
    const bigReward = 200 + levelBonus;
    
    setCoins(prev => prev + bigReward);
    setHappiness(0);
    setSleepUntil(Date.now() + SLEEP_DURATION_MS); // Ngủ 1 phút
    
    // Gọi Supabase update (bạn tự tích hợp RPC sau)
    if(userData) {
        // supabase.rpc(...)
    }

    webAppRef.current?.HapticFeedback.notificationOccurred('success');
  };

  // 4. Mua hàng trong Shop
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
         webAppRef.current?.HapticFeedback.notificationOccurred('success');
         // Gọi RPC thật ở đây
     } else {
         webAppRef.current?.HapticFeedback.notificationOccurred('error');
     }
  };

  // 5. Chuyển Tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shop') setIsShopOpen(true);
    else setIsShopOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <ClickEffects clicks={clicks} />

      {/* --- HEADER --- */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="relative pl-12 pr-6 py-3 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                {/* 3D STAR ICON */}
                <div className="absolute -left-2 -top-2 w-16 h-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-float">
                    <Image src="/assets/icons/star-3d.png" alt="Star" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start justify-center leading-none">
                    <span className="text-[10px] text-yellow-200/80 font-bold uppercase tracking-widest mb-1">Stars</span>
                    <span className="text-2xl font-black text-white tracking-wide drop-shadow-md">{coins.toLocaleString()}</span>
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
             userLevel={userData?.click_level || 1} // Truyền Level để random vật phẩm
             bubbles={bubbles} // Danh sách bong bóng
             onPopBubble={handlePopBubble} // Hàm xóa bong bóng
             onInteractSuccess={handleInteractSuccess} // Hàm nhận thưởng khi mèo ăn
           />
        )}
      </main>

      {/* --- HAPPINESS BAR --- */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm transition-all duration-500" style={{ opacity: isSleeping ? 0.6 : 1 }}>
            
            {/* 3D HEART ICON */}
            <div className="absolute -left-1 -top-4 w-14 h-14 z-20 drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                 <Image src="/assets/icons/heart-3d.png" alt="Happiness" fill className={`object-contain transition-transform ${isSleeping ? 'grayscale' : ''}`} />
            </div>

            {/* BAR */}
            <div className="w-full h-8 bg-[#12131c]/80 rounded-full border border-white/10 backdrop-blur-md overflow-hidden p-1 shadow-xl pl-12 relative">
                {/* Text chỉ số */}
                <div className="absolute inset-0 flex items-center justify-center z-10 text-xs font-bold text-white/90 drop-shadow-sm">
                    {isSleeping ? 'Sleeping (Zzz)...' : `${happiness} / ${MAX_HAPPINESS} Happiness`}
                </div>
                {/* Thanh tiến trình */}
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isSleeping ? 'bg-slate-600' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.6)]'}`}
                    style={{ width: isSleeping ? '100%' : `${(happiness / MAX_HAPPINESS) * 100}%` }}
                />
            </div>
        </div>
      </div>

      {/* --- MODALS & NAV --- */}
      <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => { setIsShopOpen(false); setActiveTab('home'); }} 
        coins={coins} 
        clickLevel={userData?.click_level || 1} 
        energyLevel={userData?.energy_level || 1} 
        onUpgrade={handleUpgrade} 
      />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); if(tab==='shop') setIsShopOpen(true); else setIsShopOpen(false); }} 
      />

      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-game-primary"/>
            <p className="text-sm text-white/50 tracking-widest font-bold">LOADING SANCTUARY...</p>
        </div>
      )}
    </div>
  );
}