'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import { Loader2, Settings } from 'lucide-react';

const MAX_HAPPINESS = 10;
const BUBBLE_GEN_RATE_MS = 5000; 
const SLEEP_DURATION_MS = 4 * 60 * 60 * 1000;

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;
  energy_level: number;
  // Các trường lưu DB khác nếu cần
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GAME STATES (Local Source of Truth) ---
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);
  
  // Sleep Logic
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(""); // FIX 2: String đếm ngược
  
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());
  const [clicks, setClicks] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const webAppRef = useRef<any>(null);
  
  // Ref để lưu state tiền chờ sync (tránh mất tiền khi navigation)
  const unsavedCoinsRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maxBubbles = userData ? 2 + userData.energy_level : 3;

  // --- INIT (Chỉ chạy 1 lần duy nhất) ---
  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        try {
          const WebApp = (await import('@twa-dev/sdk')).default;
          webAppRef.current = WebApp;
          if (WebApp.initDataUnsafe.user) {
            WebApp.ready(); WebApp.expand(); WebApp.setHeaderColor('#1a1b26');
            // Fetch data lần đầu tiên
            await fetchData(WebApp.initDataUnsafe.user.id);
          } else {
            setLoading(false);
          }
        } catch (e) { setLoading(false); }
      }
    };
    init();
  }, []);

  // --- GAME LOOP & TIMER ---
  useEffect(() => {
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // 1. Logic Đếm ngược & Tỉnh dậy
      if (sleepUntil) {
        const diff = sleepUntil - now;
        if (diff <= 0) {
          setSleepUntil(null);
          setTimeRemaining("");
          webAppRef.current?.HapticFeedback.notificationOccurred('success');
        } else {
          // FIX 3: Format hiển thị giờ:phút:giây (HH:MM:SS) cho thời gian dài
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          const hStr = hours > 0 ? `${hours}:` : '';
          const mStr = minutes < 10 ? `0${minutes}` : minutes;
          const sStr = seconds < 10 ? `0${seconds}` : seconds;
          
          setTimeRemaining(`${hStr}${mStr}:${sStr}`);
        }
      }

      // 2. Logic Spawn Bong Bóng (FIX 2: Safe Zone chuẩn xác hơn)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (prev.length >= maxBubbles || isSleeping) return prev; 
          
          const side = Math.floor(Math.random() * 3);
          let spawnX, spawnY;

          // Logic mới: Giới hạn % chặt hơn để tránh mép
          // Lưu ý: CSS đã có translate(-50%, -50%) nên ta tính tâm
          if (side === 0) { // Trên (Tránh 2 góc bo tròn của điện thoại)
             spawnX = 20 + Math.random() * 60; // 20% -> 80% chiều ngang
             spawnY = 12 + Math.random() * 5;  // 12% -> 17% chiều dọc
          } else if (side === 1) { // Trái
             spawnX = 10 + Math.random() * 5;  // 10% -> 15%
             spawnY = 25 + Math.random() * 40; // 25% -> 65%
          } else { // Phải
             spawnX = 85 + Math.random() * 5;  // 85% -> 90%
             spawnY = 25 + Math.random() * 40; // 25% -> 65%
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
      setCoins(data.coins); // FIX 4: Chỉ set coins lần đầu load app
      // Cần logic load happiness/sleep từ DB nếu muốn persist (Tạm thời để local session)
    }
    setLoading(false);
  };

  // --- SYNC TO DB (Debounce) ---
  const triggerSync = (amountToAdd: number) => {
    unsavedCoinsRef.current += amountToAdd;
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(async () => {
        if (userData && unsavedCoinsRef.current > 0) {
            const val = unsavedCoinsRef.current;
            unsavedCoinsRef.current = 0;
            // Gọi RPC ngầm
            await supabase.rpc('increment_coins', { row_id: userData.id, amount: val });
            console.log('Synced:', val);
        }
    }, 2000);
  };

  // --- ACTIONS ---

  const handlePopBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    webAppRef.current?.HapticFeedback.impactOccurred('light');
  };

  const handleInteractSuccess = (reward: number, type: string) => {
    if (isSleeping) return;

    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    setClicks(prev => [...prev, { id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]);

    // FIX 4: Cộng tiền Optimistic (Cục bộ)
    setCoins(prev => prev + reward);
    triggerSync(reward); // Lưu ngầm
    
    // FIX 3: Happiness giữ nguyên trong State (Không bị reset vì state nằm ở Home)
    if (happiness < MAX_HAPPINESS) {
      setHappiness(prev => Math.min(prev + 1, MAX_HAPPINESS));
    } 
    
    if (happiness + 1 >= MAX_HAPPINESS) {
      handleClaimBigGift();
    }
  };

  const handleClaimBigGift = () => {
    const levelBonus = (userData?.click_level || 1) * 50;
    const bigReward = 200 + levelBonus;
    
    setCoins(prev => prev + bigReward);
    triggerSync(bigReward);

    setHappiness(0);
    setSleepUntil(Date.now() + SLEEP_DURATION_MS);
    
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
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
         webAppRef.current?.HapticFeedback.notificationOccurred('success');
         // Với logic mua, nên gọi RPC ngay lập tức để trừ tiền chuẩn
         await supabase.rpc('buy_upgrade', { p_user_id: userData?.id, p_type: type });
     } else {
         webAppRef.current?.HapticFeedback.notificationOccurred('error');
     }
  };

  // FIX 3: Chuyển Tab không ảnh hưởng Happiness/Coins (Vì state nằm ở Home cha)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shop') setIsShopOpen(true);
    else setIsShopOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
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
         <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto hover:bg-white/10">
            <Settings size={22} className="text-white/80" />
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
        {/* Placeholder cho các tab khác */}
        {activeTab === 'travel' && <div className="flex items-center justify-center h-full text-white/50">Travel Coming Soon</div>}
        {activeTab === 'profile' && <div className="flex items-center justify-center h-full text-white/50">Profile Coming Soon</div>}
      </main>

      {/* HAPPINESS BAR (Có Timer) */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm transition-all duration-500" style={{ opacity: isSleeping ? 1 : 1 }}>
            
            <div className="absolute -left-1 -top-4 w-14 h-14 z-20 drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                 <Image src="/assets/icons/heart-3d.webp" alt="Happiness" fill className={`object-contain transition-transform ${isSleeping ? 'grayscale scale-90' : ''}`} />
            </div>

            <div className="w-full h-8 bg-[#12131c]/80 rounded-full border border-white/10 backdrop-blur-md overflow-hidden p-1 shadow-xl pl-12 relative">
                {/* FIX 2: Hiển thị Timer */}
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