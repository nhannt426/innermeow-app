'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import AssetPreloader from '@/components/ui/AssetPreloader';
import { Loader2 } from 'lucide-react';
import useSound from 'use-sound'; // Import trực tiếp cho BGM
import { useGameSound } from '@/hooks/useGameSound'; // Import hook cho SFX

// --- CONFIG ---
const MAX_HAPPINESS = 10;
const BUBBLE_GEN_RATE_MS = 5000; 
const SLEEP_MINUTES = 240; // 4 Tiếng (240 phút)

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;
  energy_level: number;
  sleep_until: string | null; // Thêm trường này để hứng dữ liệu từ DB
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
  const [timeRemaining, setTimeRemaining] = useState("");
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  // Bubble Logic
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());

  // UI Effects
  const [clicks, setClicks] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const webAppRef = useRef<any>(null);

  // Sync Logic
  const unsavedCoinsRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { playBgm, playEat, playSuccess, playPurr, playUi } = useGameSound();

  // Kích hoạt nhạc nền khi user tương tác lần đầu
  useEffect(() => {
    const handleUserInteraction = () => {
      // Chỉ play nếu chưa play (browser policies)
      playBgm();
      // Xóa listener để không gọi lại nhiều lần
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [playBgm]);

  // --- 1. FORCE SAVE COINS ---
  const saveProgress = async () => {
    const amount = unsavedCoinsRef.current;
    if (!userData || amount === 0) return;

    unsavedCoinsRef.current = 0;
    console.log(`Force saving: +${amount} coins`);
    
    try {
      await supabase.rpc('increment_coins', { 
        p_user_id: userData.id, 
        p_amount: amount 
      });
    } catch (error) {
      console.error("Save failed:", error);
      unsavedCoinsRef.current += amount;
    }
  };

  const triggerSync = (amountToAdd: number) => {
    unsavedCoinsRef.current += amountToAdd;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveProgress(), 1000);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveProgress();
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      saveProgress();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const maxBubbles = userData ? 2 + userData.energy_level : 3;

  // --- 2. INIT & LOAD DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready(); WebApp.expand(); WebApp.setHeaderColor('#1a1b26');
            fetchData(WebApp.initDataUnsafe.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (e) { setLoading(false); }
    };
    init();

    // --- GAME LOOP ---
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // Timer Logic
      if (sleepUntil) {
        const diff = sleepUntil - now;
        if (diff <= 0) {
          setSleepUntil(null);
          setTimeRemaining("");
          webAppRef.current?.HapticFeedback.notificationOccurred('success');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          const hStr = hours > 0 ? `${hours}:` : '';
          const mStr = minutes < 10 ? `0${minutes}` : minutes;
          const sStr = seconds < 10 ? `0${seconds}` : seconds;
          setTimeRemaining(`${hStr}${mStr}:${sStr}`);
        }
      }

      // Bubble Spawn Logic (Safe Zone)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (prev.length >= maxBubbles || isSleeping) return prev; 
          
          const side = Math.floor(Math.random() * 3);
          let spawnX, spawnY;

          if (side === 0) { // Top
             spawnX = 20 + Math.random() * 60; 
             spawnY = 15 + Math.random() * 10; 
          } else if (side === 1) { // Left
             spawnX = 15 + Math.random() * 10;  
             spawnY = 30 + Math.random() * 30; 
          } else { // Right
             spawnX = 75 + Math.random() * 10;  
             spawnY = 30 + Math.random() * 30; 
          }

          const newBubble = { id: now, x: spawnX, y: spawnY };
          lastBubbleTimeRef.current = now;
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

      // --- LOGIC CHECK THỜI GIAN NGỦ TỪ DB ---
      if (data.sleep_until) {
        const sleepTime = new Date(data.sleep_until).getTime();
        const now = Date.now();
        
        if (sleepTime > now) {
          // Vẫn đang trong giờ ngủ -> Set lại state
          setSleepUntil(sleepTime);
          setHappiness(0); // Reset happiness
        } else {
          // Đã qua giờ ngủ -> Tỉnh dậy
          setSleepUntil(null);
        }
      }
    }
    setLoading(false);
  };

  // --- ACTIONS ---

  const handlePopBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    webAppRef.current?.HapticFeedback.impactOccurred('light');
  };

  const handleInteractSuccess = (reward: number, type: string) => {
    if (isSleeping) return;

    // Kịch bản:
    // 1. Tiếng ăn trước (Ngay lập tức)
    playEat();

    // 2. Tiếng nhận tiền/tim (Sau 500ms - chờ tiếng ăn bớt ồn)
    setTimeout(() => {
        playSuccess();
        webAppRef.current?.HapticFeedback.notificationOccurred('success');
    }, 500);

    // 3. Tiếng Gừ Gừ (Sau 1 giây - khi mọi thứ lắng xuống, tạo cảm giác dư âm)
    setTimeout(() => {
        playPurr();
    }, 1200);
    setClicks(prev => [...prev, { id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]);

    setCoins(prev => prev + reward);
    triggerSync(reward);
    
    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => Math.min(prev + 1, MAX_HAPPINESS));
    } 
    
    if (happiness + 1 >= MAX_HAPPINESS) {
      handleClaimBigGift();
    }
  };

  const handleClaimBigGift = async () => {
    const levelBonus = (userData?.click_level || 1) * 50;
    const bigReward = 200 + levelBonus;
    
    // 1. Update UI (Optimistic)
    setCoins(prev => prev + bigReward);
    setHappiness(0);
    
    // Tính thời gian dậy
    const wakeUpTime = Date.now() + (SLEEP_MINUTES * 60 * 1000);
    setSleepUntil(wakeUpTime);
    
    webAppRef.current?.HapticFeedback.notificationOccurred('success');

    // 2. Gọi RPC lưu cả Tiền + Thời gian ngủ lên DB
    if(userData) {
      // Lưu ý: Đã có tiền thưởng trong hàm này nên không cần triggerSync nữa
      // để tránh cộng đôi. Reset ref tạm.
      unsavedCoinsRef.current = 0; 

      await supabase.rpc('claim_happiness_gift', { 
        p_user_id: userData.id, 
        p_reward: bigReward,
        p_sleep_minutes: SLEEP_MINUTES
      });
    }
  };

  const handleUpgrade = async (type: 'click' | 'energy', cost: number) => {
     if(coins >= cost) {
         playSuccess();
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
         await supabase.rpc('buy_upgrade', { p_user_id: userData?.id, p_type: type });
     } else {
         webAppRef.current?.HapticFeedback.notificationOccurred('error');
     }
  };

  const handleTabChange = (tab: string) => {
    playUi();
    setActiveTab(tab);
    if (tab === 'shop') setIsShopOpen(true);
    else setIsShopOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <AssetPreloader />
      <ClickEffects clicks={clicks} />

      {/* HEADER */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="relative pl-12 pr-6 py-3 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <div className="absolute -left-2 -top-2 w-16 h-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-float">
                    <Image src="/assets/icons/star-3d.webp" alt="Star" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start justify-center leading-none">
                    <span className="text-[10px] text-yellow-200/80 font-bold uppercase tracking-widest mb-1">Stars</span>
                    <span className="text-2xl font-black text-white tracking-wide drop-shadow-md">{coins.toLocaleString()}</span>
                </div>
            </div>
         </div>
         <button 
            onClick={() => playUi()} 
            // Xóa background đen mờ cũ đi, chỉ giữ lại hiệu ứng active scale
            className="relative w-12 h-12 flex items-center justify-center active:scale-90 transition-transform group"
         >
            {/* Hiệu ứng Glow nhẹ phía sau khi hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Ảnh 3D */}
            <div className="relative w-9 h-9 drop-shadow-md group-hover:scale-110 transition-transform duration-300 ease-spring">
                 <Image 
                    src="/assets/icons/settings-3d.png" 
                    alt="Settings" 
                    fill 
                    className="object-contain"
                 />
            </div>
         </button>
      </header>

      {/* MAIN SCENE */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene 
             userLevel={userData?.click_level || 1}
             bubbles={bubbles}
             onPopBubble={handlePopBubble}
             onInteractSuccess={handleInteractSuccess}
           />
        )}
        {activeTab === 'travel' && <div className="flex items-center justify-center h-full text-white/50">Travel Coming Soon</div>}
        {activeTab === 'profile' && <div className="flex items-center justify-center h-full text-white/50">Profile Coming Soon</div>}
      </main>

      {/* HAPPINESS BAR */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm transition-all duration-500" style={{ opacity: isSleeping ? 1 : 1 }}>
            <div className="absolute -left-1 -top-4 w-14 h-14 z-20 drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                 <Image src="/assets/icons/heart-3d.webp" alt="Happiness" fill className={`object-contain transition-transform ${isSleeping ? 'grayscale scale-90' : ''}`} />
            </div>
            <div className="w-full h-8 bg-[#12131c]/80 rounded-full border border-white/10 backdrop-blur-md overflow-hidden p-1 shadow-xl pl-12 relative">
                <div className="absolute inset-0 flex items-center justify-center z-10 text-xs font-bold text-white/90 drop-shadow-sm font-mono tracking-wider">
                    {isSleeping ? `Zzz... ${timeRemaining}` : `${happiness} / ${MAX_HAPPINESS} Happiness`}
                </div>
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isSleeping ? 'bg-slate-600' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.6)]'}`}
                    style={{ width: isSleeping ? '100%' : `${(happiness / MAX_HAPPINESS) * 100}%` }}
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