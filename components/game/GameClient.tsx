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
import { useGameSound } from '@/hooks/useGameSound';
import FloatingNumbers, { FloatingText } from '@/components/ui/FloatingNumbers';

// --- CONFIG ---
const BASE_MAX_HAPPINESS = 10; 
const BUBBLE_GEN_RATE_MS = 3000; 
const SLEEP_MINUTES = 240; 
const SCREEN_BUBBLE_LIMIT = 6; 

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;
  energy_level: number;
  sanctuary_level: number;
  sleep_until: string | null;
}

export default function GameClient() {
  const unsavedCoinsRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GAME STATES ---
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);
  
  // ✅ LOGIC: Max Happiness tăng theo Level (Mind Space)
  const maxHappiness = userData ? BASE_MAX_HAPPINESS + (userData.energy_level - 1) : BASE_MAX_HAPPINESS;
  
  // Sleep Logic
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  // Bubble Logic
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());

  // ✅ STATE MỚI: QUẢN LÝ SỐ NỔI
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // UI & Sounds
  const [clicks, setClicks] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const webAppRef = useRef<any>(null);
  const { playBgm, playEat, playSuccess, playPurr, stopPurr, playUi } = useGameSound();

  // BGM Autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      playBgm();
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

  // Purr Logic
  useEffect(() => {
    if (isSleeping) playPurr();
    else stopPurr();
    return () => { stopPurr(); };
  }, [isSleeping, playPurr, stopPurr]);

  // Save Logic
  const saveProgress = async () => {
    const amount = unsavedCoinsRef.current;
    if (!userData || amount === 0) return;
    unsavedCoinsRef.current = 0;
    try {
      await supabase.rpc('increment_coins', { p_user_id: userData.id, p_amount: amount });
    } catch (error) { unsavedCoinsRef.current += amount; }
  };

  const triggerSync = (amountToAdd: number) => {
    unsavedCoinsRef.current += amountToAdd;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveProgress(), 1000);
  };

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveProgress(); };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { window.removeEventListener('visibilitychange', handleVisibilityChange); saveProgress(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Init Data
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
          // MOCK DATA FOR DEV
          if (process.env.NODE_ENV === 'development') {
             console.log("⚠️ Running in DEV mode - Mocking User Data");
             // 👇 ID của bạn để test local
             const MY_TELEGRAM_ID = 2101221512; 
             await fetchData(MY_TELEGRAM_ID);
             return; 
          }

          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready(); WebApp.expand(); WebApp.setHeaderColor('#1a1b26');
            fetchData(WebApp.initDataUnsafe.user.id);
          } else { setLoading(false); }
        }
      } catch (e) { console.error("Init Error:", e); setLoading(false); }
    };
    init();

    // Game Loop
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

      // Bubble Spawn Logic (Dynamic Cap)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (isSleeping) return prev;

          // Tính giới hạn động: Mèo càng no, bóng ra càng ít
          const remainingHappinessSlots = maxHappiness - happiness;
          const currentDynamicCap = Math.min(SCREEN_BUBBLE_LIMIT, remainingHappinessSlots + 1);

          if (prev.length >= currentDynamicCap) return prev;
          
          const side = Math.floor(Math.random() * 3);
          let spawnX, spawnY;
          if (side === 0) { // Top
             spawnX = 20 + Math.random() * 60; spawnY = 15 + Math.random() * 10; 
          } else if (side === 1) { // Left
             spawnX = 15 + Math.random() * 10; spawnY = 30 + Math.random() * 30; 
          } else { // Right
             spawnX = 75 + Math.random() * 10; spawnY = 30 + Math.random() * 30; 
          }

          lastBubbleTimeRef.current = now; 
          return [...prev, { id: now, x: spawnX, y: spawnY }];
        });
      }
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [maxHappiness, happiness, sleepUntil, isSleeping]); 

  const fetchData = async (tid: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    if (data) {
      setUserData(data);
      setCoins(data.coins);
      if (data.sleep_until) {
        const sleepTime = new Date(data.sleep_until).getTime();
        if (sleepTime > Date.now()) {
          setSleepUntil(sleepTime);
          setHappiness(0);
        } else {
          setSleepUntil(null);
        }
      }
    }
    setLoading(false);
  };

  const handlePopBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    webAppRef.current?.HapticFeedback.impactOccurred('light');
  };

  const handleInteractSuccess = (reward: number, type: string, x: number, y: number) => {
    if (isSleeping) return;

    // 1. Âm thanh
    playEat();
    setTimeout(() => { playSuccess(); webAppRef.current?.HapticFeedback.notificationOccurred('success'); }, 500);
    
    // 2. Click Effect (Vòng tròn lan tỏa)
    setClicks(prev => [...prev, { id: Date.now(), x, y }]); // Dùng tọa độ thật
    
    // 3. ✅ FLOATING TEXT EFFECT (Số tiền bay lên)
    const textId = `${Date.now()}-${Math.random()}`; 

    setFloatingTexts(prev => [...prev, { id: textId, value: reward, x, y, type: 'normal' }]);
    
    setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 1000);

    // 4. Logic cộng tiền
    setCoins(prev => prev + reward);
    triggerSync(reward);
    
    // 5. Logic Happiness
    if (happiness < maxHappiness) {
        const newHappiness = happiness + 1;
        setHappiness(newHappiness);
        if (newHappiness >= maxHappiness) {
            handleClaimBigGift();
        }
    } 
  };

  const handleClaimBigGift = async () => {
    // Tính toán Bonus: 100 Base + (Level Nhà * 20) + (Level Mind * 10)
    const sanctuaryBonus = (userData?.sanctuary_level || 1) * 20;
    const mindBonus = (userData?.energy_level || 1) * 10;
    const bonusReward = 100 + sanctuaryBonus + mindBonus;
    
    // Cộng tiền
    setCoins(prev => prev + bonusReward);
    
    // Reset Happiness
    setHappiness(0);
    
    // Trigger Sleep
    const wakeUpTime = Date.now() + (SLEEP_MINUTES * 60 * 1000);
    setSleepUntil(wakeUpTime);
    
    // Haptic & Sound
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    // Có thể thêm sound khác đặc biệt hơn ở đây nếu muốn
    playSuccess(); 

    // ✅ HIỆN SỐ BONUS (Bay từ giữa màn hình dưới - vị trí thanh Happiness)
    const textId = `${Date.now()}-${Math.random()}`;
    const centerX = window.innerWidth / 2;
    const bottomY = window.innerHeight - 150;

    setFloatingTexts(prev => [...prev, { 
        id: textId, 
        value: bonusReward, 
        x: centerX, 
        y: bottomY,
        type: 'bonus'
    }]);

    setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 1500);

    // Lưu DB
    if(userData) {
      unsavedCoinsRef.current = 0; 
      // Gọi hàm RPC cũ, nhưng truyền số tiền Bonus mới
      await supabase.rpc('claim_happiness_gift', { 
        p_user_id: userData.id, 
        p_reward: bonusReward,
        p_sleep_minutes: SLEEP_MINUTES
      });
    }
  };

  const handleUpgrade = async (type: 'click' | 'energy' | 'sanctuary', cost: number) => {
    if(coins >= cost) {
        playSuccess();
        setCoins(prev => prev - cost);
        setUserData(prev => {
            if(!prev) return null;
            return {
                ...prev,
                click_level: type === 'click' ? prev.click_level + 1 : prev.click_level,
                energy_level: type === 'energy' ? prev.energy_level + 1 : prev.energy_level,
                sanctuary_level: type === 'sanctuary' ? (prev.sanctuary_level || 1) + 1 : (prev.sanctuary_level || 1)
            }
        });
        webAppRef.current?.HapticFeedback.notificationOccurred('success');

        if (type === 'sanctuary') {
            await supabase.rpc('buy_sanctuary_upgrade', { p_user_id: userData?.id, p_cost: cost });
        } else {
            await supabase.rpc('buy_upgrade', { p_user_id: userData?.id, p_type: type });
        }
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
  
  // DEV TOOLS: HACK COINS
  const handleDevHack = async () => {
    if (!userData) return;
    const CHEAT_AMOUNT = 1000000; 
    setCoins(prev => prev + CHEAT_AMOUNT);
    try {
        await supabase.rpc('increment_coins', { p_user_id: userData.id, p_amount: CHEAT_AMOUNT });
        playSuccess(); 
    } catch (err) { console.error(err); }
  };

  // DEV TOOLS: RESET
  const handleDevReset = async () => {
    if (!userData) return;
    if (!confirm("⚠️ CẢNH BÁO: Reset toàn bộ?")) return;
    stopPurr(); 
    setCoins(0); setHappiness(0); setSleepUntil(null); setTimeRemaining(""); setActiveTab('home');
    setUserData(prev => prev ? ({ ...prev, coins: 0, click_level: 1, energy_level: 1, sanctuary_level: 1, sleep_until: null }) : null);
    try {
        await supabase.rpc('reset_user_account', { p_user_id: userData.id });
        playSuccess(); 
    } catch (err: any) { alert(`Lỗi Reset: ${err.message}`); }
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <AssetPreloader />
      <ClickEffects clicks={clicks} />
      <FloatingNumbers texts={floatingTexts} />
      {/* HEADER */}
      <header className="absolute top-0 w-full p-6 flex justify-between z-40 pointer-events-none">
         <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="relative pl-12 pr-6 py-3 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <div className="absolute -left-2 top-1 w-20 h-20 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-float">
                    <Image src="/assets/icons/star-3d.webp" alt="Star" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start justify-center leading-none ml-4">
                    <span className="text-[10px] text-yellow-200/80 font-bold uppercase tracking-widest mb-1">Stars</span>
                    <span className="text-2xl font-black text-white tracking-wide drop-shadow-md">{coins.toLocaleString()}</span>
                </div>
            </div>
         </div>
         <button onClick={() => playUi()} className="relative w-12 h-12 flex items-center justify-center active:scale-90 transition-transform group pointer-events-auto">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-9 h-9 drop-shadow-md group-hover:scale-110 transition-transform duration-300 ease-spring">
                 <Image src="/assets/icons/settings-3d.webp" alt="Settings" fill className="object-contain" />
            </div>
         </button>
      </header>

      {/* MAIN SCENE */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene 
             userLevel={userData?.click_level || 1}
             sanctuaryLevel={userData?.sanctuary_level || 1}
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
                    {isSleeping ? `Zzz... ${timeRemaining}` : `${happiness} / ${maxHappiness} Happiness`}
                </div>
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isSleeping ? 'bg-slate-600' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.6)]'}`}
                    style={{ width: isSleeping ? '100%' : `${(happiness / maxHappiness) * 100}%` }}
                />
            </div>
        </div>
      </div>

      <ShopModal 
       isOpen={isShopOpen} 
       onClose={() => { setIsShopOpen(false); setActiveTab('home'); }} 
       coins={coins} 
       clickLevel={userData?.click_level || 1} 
       energyLevel={userData?.energy_level || 1} 
       sanctuaryLevel={userData?.sanctuary_level || 1}
       onUpgrade={handleUpgrade} />
      
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* DEV BUTTONS */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-2 items-end">
            <button onClick={handleDevHack} className="cursor-pointer bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border-2 border-white/20 active:scale-90 hover:bg-red-500 transition-all">🐞 +1M Coins</button>
            <button onClick={handleDevReset} className="cursor-pointer bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border-2 border-white/20 active:scale-90 hover:bg-slate-500 transition-all">🔄 Reset All</button>
        </div>
      )}
      
      {loading && <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-game-primary"/></div>}
    </div>
  );
}