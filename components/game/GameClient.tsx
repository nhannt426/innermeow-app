'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';
import InventoryView from '@/components/game/InventoryView';

// Components
import RoomScene from '@/components/game/RoomScene';
import Navigation from '@/components/ui/Navigation';
import ClickEffects from '@/components/ui/ClickEffects';
import ShopModal from '@/components/game/ShopModal';
import AssetPreloader from '@/components/ui/AssetPreloader';
import FloatingNumbers, { FloatingText } from '@/components/ui/FloatingNumbers';
import RewardModal from '@/components/game/RewardModal';
import Toast from '@/components/ui/Toast';
import { TRAVEL_MAPS, getRandomTravelDrop } from '@/constants/travelData';
import TravelMenu from '@/components/game/TravelMenu';
import TravelScene from '@/components/game/TravelScene';

// --- 1. CONFIGURATION ---
const BASE_MAX_HAPPINESS = 10;
const BUBBLE_GEN_RATE_MS = 3000;
const SCREEN_BUBBLE_LIMIT = 6;
const DIGESTION_RATE_AWAKE_MS = 20 * 60 * 1000; // 20 phút
const DIGESTION_RATE_SLEEP_MS = 10 * 60 * 1000; // 10 phút

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  click_level: number;
  energy_level: number;
  sanctuary_level: number;
  sleep_until: string | null;
  ticket_count: number;
  tickets_bought_today: number;
  coffee_buy_count: number;
  buff_wealth: number;
  buff_luck: number;
  inventory_coffee: number;
  memory_dust: number;
}

export default function GameClient() {
  // --- 2. STATE & REFS ---
  
  // Data State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [happiness, setHappiness] = useState(0);

  // Game Logic State
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [clicks, setClicks] = useState<any[]>([]);

  // Refs
  const unsavedCoinsRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDigestionTimeRef = useRef<number>(Date.now());
  const lastBubbleTimeRef = useRef<number>(Date.now());
  const webAppRef = useRef<any>(null);

  // Calculated Values
  const maxHappiness = userData ? BASE_MAX_HAPPINESS + userData.energy_level : BASE_MAX_HAPPINESS;
  const isSleeping = sleepUntil ? Date.now() < sleepUntil : false;

  // Custom Hooks
  const { playBgm, playEat, playSuccess, playPurr, stopPurr, playUi } = useGameSound();

  const [hasNewItems, setHasNewItems] = useState(false);

  const [rewardModalOpen, setRewardModalOpen] = useState(false); // State bật tắt modal
  const [rewardsData, setRewardsData] = useState<string[]>([]); // Data phần thưởng
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  // Thêm State quản lý Travel
  const [currentMap, setCurrentMap] = useState<string | null>(null); // Đang ở map nào? (null = ở nhà)
  const [collectionData, setCollectionData] = useState<any[]>([]); // Data tiến độ sưu tập

  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  // --- 3. HELPER FUNCTIONS (SYNC & LOGIC) ---
  const handleStartTravel = async (mapId: string) => {
     if (!userData || userData.ticket_count <= 0) {
         showToast("No tickets left!", "error");
         return;
     }

     // 1. Trừ vé ở Client (Visual)
     setUserData(prev => prev ? ({ ...prev, ticket_count: prev.ticket_count - 1 }) : null);
     
     // 2. Chuyển cảnh
     setCurrentMapId(mapId);
     setActiveTab('travel_scene'); // Tab ảo để render scene
     
     // 3. Update Server (Trừ vé trong DB)
     // Bạn nên viết RPC 'use_ticket' hoặc update trực tiếp
     await supabase.from('users').update({ ticket_count: userData.ticket_count - 1 }).eq('id', userData.id);
  };

  // LOGIC: Thoát Travel
  const handleExitTravel = () => {
     setCurrentMapId(null);
     setActiveTab('travel'); // Quay về menu chọn map
     // Tắt âm thanh Travel đã được xử lý trong useEffect của TravelScene
     playBgm(); // Bật lại nhạc nền chính
  };
  const handleBubbleClickWrapper = (id: number) => {
      // Tìm bong bóng để lấy tọa độ (cho effect)
      const bubble = bubbles.find(b => b.id === id);
      const x = bubble?.x || 50;
      const y = bubble?.y || 50;
      
      handlePopBubble(id); // Xóa bong bóng & Haptic

      if (currentMapId) {
          // --- LOGIC TRAVEL ---
          handleTravelDrop(x, y);
      } else {
          // --- LOGIC NHÀ (Cũ) ---
          // Random reward cũ
          const baseReward = Math.floor(Math.random() * (20 - 5 + 1)) + 5; 
          handleInteractSuccess(baseReward, 'coin', x, y);
      }
  };

  // LOGIC MỚI: Rớt đồ khi Travel
  const handleTravelDrop = async (x: number, y: number) => {
      if (!currentMapId) return;

      // 1. Random Item từ config
      const dropItem = getRandomTravelDrop(currentMapId);
      if (!dropItem) return; // Không rớt gì

      // 2. Gọi Server (RPC collect_fragment)
      // (Giữ nguyên logic gọi API như cũ) ...
      const { data } = await supabase.rpc('collect_fragment', {
          p_user_id: userData?.id,
          p_map_id: currentMapId,
          p_item_id: dropItem.id,
          p_max_fragments: dropItem.fragmentsRequired
      });

      // 3. XỬ LÝ HIỆU ỨNG BAY (FLOATING EFFECT)
      const textId = `${Date.now()}-${Math.random()}`;

      if (data && data.status === 'dust') {
          // A. TRƯỜNG HỢP RA BỤI (DUPLICATE)
          // Hiện ảnh Bụi Ký Ức
          setFloatingTexts(prev => [...prev, {
             id: textId, x, y,
             value: `+${data.amount}`,
             type: 'fragment',
             imgSrc: '/assets/icons/memory-dust.webp' // Ảnh bụi
          }]);
          
          // Update data
          setUserData(prev => prev ? ({ ...prev, memory_dust: (prev.memory_dust || 0) + data.amount }) : null);

      } else {
          // B. TRƯỜNG HỢP RA MẢNH GHÉP (NEW FRAGMENT)
          // Hiện ảnh của chính Item đó
          setFloatingTexts(prev => [...prev, {
             id: textId, x, y,
             value: '+1', // Text hiển thị kèm
             type: 'fragment', // Type mới
             imgSrc: `/assets/travel/items/${currentMapId}/item-${dropItem.id}.webp`
          }]);
          
          // (Optional) Toast báo tên item cho rõ
          // showToast(`Found ${dropItem.name} piece!`, 'success');
      }

      // Xóa effect sau 1s
      setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== textId)), 1000);

      // Tăng Happiness
      if (happiness < maxHappiness) setHappiness(prev => prev + 1);
  };
  
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ 
      show: false, msg: '', type: 'success' 
  });

  // Hàm helper để gọi Toast nhanh gọn
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ show: true, msg, type });
  };

  const handleUseInventoryCoffee = async () => {
      if (!userData || userData.inventory_coffee <= 0 || !isSleeping) return;
      
      // Trừ Client
      setUserData(prev => prev ? ({ ...prev, inventory_coffee: prev.inventory_coffee - 1 }) : null);
      handleWakeUp(); // Đánh thức
      
      // Gọi Server (Bạn cần đảm bảo có hàm RPC tương ứng hoặc update trực tiếp)
      // Tạm thời update visual client trước cho mượt
      await supabase.rpc('use_inventory_coffee', { p_user_id: userData.id }); 
  };

  const saveProgress = async () => {
    const amount = unsavedCoinsRef.current;
    if (!userData || amount === 0) return;
    unsavedCoinsRef.current = 0;
    try {
      await supabase.rpc('increment_coins', { p_user_id: userData.id, p_amount: amount });
    } catch (error) {
      unsavedCoinsRef.current += amount; // Revert if failed
    }
  };

  const triggerSync = (amountToAdd: number) => {
    unsavedCoinsRef.current += amountToAdd;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveProgress(), 1000);
  };

  const fetchData = async (tid: number) => {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    if (data) {
      setUserData(data);
      setCoins(data.coins);
      // Check sleep status
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

  const handleWakeUp = () => {
    setSleepUntil(null);
    setTimeRemaining("");
    setHappiness(0);
    stopPurr();
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    
    // Sync to DB
    if (userData) {
      supabase.from('users').update({ sleep_until: null }).eq('id', userData.id).then();
    }
  };

  // --- 4. GAMEPLAY HANDLERS ---

  const handleClaimBigGift = async () => {
    const bonusReward = 100 + (userData?.sanctuary_level || 1) * 20;
    
    // Update Client
    setCoins(prev => prev + bonusReward);
    setHappiness(0);
    
    // Sleep Logic: 1 Happiness = 10 mins
    const sleepDurationMs = maxHappiness * 10 * 60 * 1000;
    const wakeUpTime = Date.now() + sleepDurationMs;
    setSleepUntil(wakeUpTime);

    // Effects
    playSuccess();
    webAppRef.current?.HapticFeedback.notificationOccurred('success');
    
    // Floating Bonus Text
    const textId = `${Date.now()}-${Math.random()}`;
    setFloatingTexts(prev => [...prev, { 
        id: textId, value: bonusReward, x: window.innerWidth / 2, y: window.innerHeight - 150, type: 'bonus' 
    }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== textId)), 1500);

    // Sync DB
    if (userData) {
      unsavedCoinsRef.current = 0;
      await supabase.rpc('claim_happiness_gift', { 
        p_user_id: userData.id, 
        p_reward: bonusReward, 
        p_sleep_minutes: maxHappiness * 10 // Store minutes
      });
    }
  };

  const handleInteractSuccess = (reward: number, type: string, x: number, y: number) => {
    if (isSleeping) return;

    // 1. Wealth Buff Logic
    let finalReward = reward;
    const hasWealthBuff = (userData?.buff_wealth || 0) > 0;
    if (hasWealthBuff) {
      finalReward = reward * 2;
      setUserData(prev => prev ? ({ ...prev, buff_wealth: Math.max(0, prev.buff_wealth - 1) }) : null);
    }

    // 2. Add Coins & Sync
    setCoins(prev => prev + finalReward);
    triggerSync(finalReward);

    // 3. Effects
    playEat();
    setTimeout(() => { playSuccess(); webAppRef.current?.HapticFeedback.notificationOccurred('success'); }, 500);
    setClicks(prev => [...prev, { id: Date.now(), x, y }]);

    // Floating Text
    const textId = `${Date.now()}-${Math.random()}`;
    setFloatingTexts(prev => [...prev, { 
        id: textId, value: finalReward, x, y, type: hasWealthBuff ? 'bonus' : 'normal' 
    }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== textId)), 1000);

    // 4. Update Happiness
    if (happiness < maxHappiness) {
      const newHappiness = happiness + 1;
      setHappiness(newHappiness);
      if (newHappiness >= maxHappiness) {
        handleClaimBigGift();
      }
    }
  };

  const handlePopBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    webAppRef.current?.HapticFeedback.impactOccurred('light');
  };

  // --- 5. SHOP HANDLERS ---

  const handleShopAction = async (type: string, param: any) => {
    // --- 1. XÁC ĐỊNH GIÁ TIỀN (COST) ---
    let cost = 0;

    if (type === 'buy_mystery_box') {
        const quantity = param as number; // Ở đây param là số lượng (1 hoặc 10)
        cost = quantity === 10 ? 5500 : 600 * quantity;
    } else {
        // Với Upgrade, Ticket, Coffee: param chính là giá tiền
        cost = param as number;
    }

    // --- 2. KIỂM TRA SỐ DƯ (Chung cho tất cả) ---
    if (coins < cost) {
      webAppRef.current?.HapticFeedback.notificationOccurred('error');
      return; // Dừng ngay nếu không đủ tiền
    }

    // --- 3. XỬ LÝ LOGIC THEO TỪNG LOẠI ---

    // A. Common: Upgrade Stats / Sanctuary
    if (['click', 'energy', 'sanctuary'].includes(type)) {
        playSuccess();
        setCoins(prev => prev - cost);
        setUserData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                click_level: type === 'click' ? prev.click_level + 1 : prev.click_level,
                energy_level: type === 'energy' ? prev.energy_level + 1 : prev.energy_level,
                sanctuary_level: type === 'sanctuary' ? (prev.sanctuary_level || 1) + 1 : (prev.sanctuary_level || 1)
            };
        });
        webAppRef.current?.HapticFeedback.notificationOccurred('success');

        const rpcName = type === 'sanctuary' ? 'buy_sanctuary_upgrade' : 'buy_upgrade';
        const params = type === 'sanctuary' ? { p_user_id: userData?.id, p_cost: cost } : { p_user_id: userData?.id, p_type: type };
        await supabase.rpc(rpcName, params);
        return;
    }

    // B. Consumables: Travel Ticket
    if (type === 'buy_ticket') {
        const { data } = await supabase.rpc('buy_ticket', { p_user_id: userData?.id });
        if (data?.success) {
            setCoins(prev => prev - cost);
            setUserData(prev => prev ? ({ ...prev, ticket_count: prev.ticket_count + 1, tickets_bought_today: prev.tickets_bought_today + 1 }) : null);
            showToast("+1 Ticket Purchased! 🎫");
            playSuccess();
        } else {
            alert(data?.message || "Purchase failed");
        }
        return;
    }

    // Consumables: Coffee
    if (type === 'buy_coffee') {
        const { data } = await supabase.rpc('buy_coffee', { p_user_id: userData?.id });
        if (data?.success) {
            setCoins(prev => prev - cost);
            
            // Logic cũ: handleWakeUp(); (Đã xóa)
            
            // Logic mới: Cộng vào kho
            setUserData(prev => prev ? ({ 
                ...prev, 
                coffee_buy_count: prev.coffee_buy_count + 1,
                inventory_coffee: prev.inventory_coffee + 1 
            }) : null);
            
            setHasNewItems(true); 
            playSuccess();
            
            // ✅ THAY ALERT BẰNG TOAST ĐẸP
            showToast("Coffee added to Bag! 🎒"); 
        }
        return;
    }

    // D. Consumables: Mystery Box
    if (type === 'buy_mystery_box') {
        // Lưu ý: Đã check tiền ở bước 2 rồi, không cần check lại ở đây
        const quantity = param; 
        
        // Gọi Server
        const { data, error } = await supabase.rpc('buy_mystery_box', { 
            p_user_id: userData?.id, 
            p_quantity: quantity 
        });

        if (data && data.success) {
            // Update UI
            fetchData(userData!.telegram_id);
            
            // Hiển thị Modal
            setRewardsData(data.rewards);
            setRewardModalOpen(true);
            setHasNewItems(true); // Bật chấm đỏ Inventory
            playSuccess();
        } else {
            alert("Error buying box");
        }
        return;
    }
  };

  // --- 6. EFFECTS (LIFECYCLE) ---

  // Init Data
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
            // MOCK FOR DEV
            if (process.env.NODE_ENV === 'development') {
                console.log("⚠️ Running in DEV mode");
                const MY_TELEGRAM_ID = 2101221512; // Change this if needed
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
      } catch (e) { console.error("Init Error", e); setLoading(false); }
    };
    init();
  }, []);

  // Digestion Loop (Passive Decay)
  useEffect(() => {
    const digestionLoop = setInterval(() => {
        const now = Date.now();
        const timePassed = now - lastDigestionTimeRef.current;
        const rate = isSleeping ? DIGESTION_RATE_SLEEP_MS : DIGESTION_RATE_AWAKE_MS;

        if (timePassed >= rate && happiness > 0) {
            setHappiness(prev => Math.max(0, prev - 1));
            lastDigestionTimeRef.current = now;
            
            // Auto wake up if slept enough
            if (isSleeping && happiness <= 1) {
                handleWakeUp();
            }
        }
    }, 1000);
    return () => clearInterval(digestionLoop);
  }, [happiness, isSleeping]);

  // Main Game Loop (Timer & Bubbles)
  useEffect(() => {
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // 1. Sleep Timer Logic
      if (sleepUntil) {
        const diff = sleepUntil - now;
        if (diff <= 0) {
          handleWakeUp();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours > 0 ? hours + ':' : ''}${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
        }
      }

      // 2. Bubble Spawn Logic (Dynamic Cap)
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (isSleeping) return prev;
          
          const remainingHappinessSlots = maxHappiness - happiness;
          const currentDynamicCap = Math.min(SCREEN_BUBBLE_LIMIT, remainingHappinessSlots + 1);
          if (prev.length >= currentDynamicCap) return prev;
          
          // Random Position
          const side = Math.floor(Math.random() * 3);
          let spawnX, spawnY;
          if (side === 0) { spawnX = 20 + Math.random() * 60; spawnY = 15 + Math.random() * 10; } // Top
          else if (side === 1) { spawnX = 15 + Math.random() * 10; spawnY = 30 + Math.random() * 30; } // Left
          else { spawnX = 75 + Math.random() * 10; spawnY = 30 + Math.random() * 30; } // Right

          lastBubbleTimeRef.current = now;
          return [...prev, { id: now, x: spawnX, y: spawnY }];
        });
      }
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [maxHappiness, happiness, sleepUntil, isSleeping]);

  // BGM & Audio
  useEffect(() => {
    const handleInteract = () => { playBgm(); window.removeEventListener('click', handleInteract); };
    window.addEventListener('click', handleInteract);
    return () => window.removeEventListener('click', handleInteract);
  }, [playBgm]);

  useEffect(() => {
    if (isSleeping) playPurr(); else stopPurr();
    return () => stopPurr();
  }, [isSleeping, playPurr, stopPurr]);

  // Save on Hidden
  useEffect(() => {
    const handleVis = () => { if (document.visibilityState === 'hidden') saveProgress(); };
    window.addEventListener('visibilitychange', handleVis);
    return () => { window.removeEventListener('visibilitychange', handleVis); saveProgress(); };
  }, [userData]);


  // --- 7. DEV TOOLS ---
  const handleDevHack = async () => {
    if (!userData) return;
    setCoins(prev => prev + 1000000);
    await supabase.rpc('increment_coins', { p_user_id: userData.id, p_amount: 1000000 });
    playSuccess();
  };
  const handleDevReset = async () => {
    if (!userData || !confirm("Reset All?")) return;
    stopPurr(); setCoins(0); setHappiness(0); setSleepUntil(null); setTimeRemaining(""); setActiveTab('home');
    setUserData(prev => prev ? ({ ...prev, coins: 0, click_level: 1, energy_level: 1, sanctuary_level: 1, sleep_until: null }) : null);
    await supabase.rpc('reset_user_account', { p_user_id: userData.id });
    playSuccess();
  };

  const handleTabChange = (tab: string) => {
    playUi();
    if (tab === 'travel') {
        setActiveTab('travel');
        setIsShopOpen(false);
        setIsInventoryOpen(false);
        return;
    }
    setActiveTab(tab);
    // Logic mới: Tab nào là Modal thì bật state lên
    setIsShopOpen(tab === 'shop');
    setIsInventoryOpen(tab === 'inventory');
    
    // Tắt noti nếu vào kho
    if (tab === 'inventory') setHasNewItems(false);
  };

  // --- 8. RENDER ---
  return (
    <div className="relative min-h-screen bg-game-bg text-game-text overflow-hidden font-sans select-none touch-none">
      <AssetPreloader />
      <ClickEffects clicks={clicks} />
      <FloatingNumbers texts={floatingTexts} />
      <Toast 
        isVisible={toast.show} 
        message={toast.msg} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
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

      {/* ACTIVE BUFFS INDICATOR */}
      <div className="absolute top-24 left-6 flex flex-col gap-2 z-30 pointer-events-none">
        {(userData?.buff_wealth || 0) > 0 && (
            <div className="bg-black/60 backdrop-blur-md pl-1 pr-3 py-1 rounded-full border border-yellow-500/30 flex items-center gap-2 animate-pulse-slow shadow-lg">
                {/* Ảnh Potion nhỏ */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/shop/reward-wealth.webp" alt="Wealth" className="w-8 h-8 object-contain drop-shadow-sm" />
                
                <div className="flex flex-col leading-none">
                    <span className="text-yellow-300 font-bold text-xs">x2 Coins</span>
                    <span className="text-[10px] text-slate-300">({userData?.buff_wealth} left)</span>
                </div>
            </div>
        )}

        {/* LUCK BUFF */}
        {(userData?.buff_luck || 0) > 0 && (
            <div className="bg-black/60 backdrop-blur-md pl-1 pr-3 py-1 rounded-full border border-green-500/30 flex items-center gap-2 animate-pulse-slow shadow-lg">
                {/* Ảnh Potion nhỏ */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/shop/reward-luck.webp" alt="Luck" className="w-8 h-8 object-contain drop-shadow-sm" />
                
                <div className="flex flex-col leading-none">
                    <span className="text-green-300 font-bold text-xs">Lucky</span>
                    <span className="text-[10px] text-slate-300">({userData?.buff_luck} left)</span>
                </div>
            </div>
        )}
      </div>

      {/* MAIN SCENE */}
      <main className="relative z-10 w-full h-screen pt-10">
        {activeTab === 'home' && (
           <RoomScene 
             userLevel={userData?.click_level || 1}
             sanctuaryLevel={userData?.sanctuary_level || 1}
             bubbles={bubbles}
             onPopBubble={handleBubbleClickWrapper}
             onInteractSuccess={handleInteractSuccess}
           />
        )}
        {activeTab === 'travel' && userData && (
           <TravelMenu 
              ticketCount={userData.ticket_count}
              onTravel={handleStartTravel}
           />
        )}

        {/* CASE 3: TRAVEL SCENE (GAMEPLAY) */}
        {activeTab === 'travel_scene' && currentMapId && (
            <TravelScene 
                mapId={currentMapId}
                bubbles={bubbles}
                onPopBubble={handleBubbleClickWrapper}
                onExit={handleExitTravel}
            />
        )}    
        {activeTab === 'profile' && <div className="flex items-center justify-center h-full text-white/50">Profile Coming Soon</div>}
      </main>

      {/* HAPPINESS BAR */}
      <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-sm transition-all duration-500" style={{ opacity: 1 }}>
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
       ticketsBought={userData?.tickets_bought_today || 0}
       coffeeBuyCount={userData?.coffee_buy_count || 0}
       isSleeping={isSleeping}
       onUpgrade={handleShopAction} 
       />
      {userData && (
        <InventoryView 
          isOpen={isInventoryOpen} // Truyền state mở
          onClose={() => { setIsInventoryOpen(false); setActiveTab('home'); }} // Đóng thì về Home
          ticketCount={userData.ticket_count}
          coffeeCount={userData.inventory_coffee}
          buffWealth={userData.buff_wealth}
          buffLuck={userData.buff_luck}
          isSleeping={isSleeping}
          onUseCoffee={handleUseInventoryCoffee}
        />
      )}
      <RewardModal 
          isOpen={rewardModalOpen} 
          rewards={rewardsData} 
          onClose={() => setRewardModalOpen(false)} 
      />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} hasNotification={hasNewItems} />

      {/* DEV BUTTONS */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-2 items-end">
            <button onClick={handleDevHack} className="cursor-pointer bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border-2 border-white/20 active:scale-90">🐞 +1M Coins</button>
            <button onClick={handleDevReset} className="cursor-pointer bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border-2 border-white/20 active:scale-90">🔄 Reset All</button>
        </div>
      )}
      
      {loading && <div className="fixed inset-0 bg-game-bg z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-game-primary"/></div>}
    </div>
  );
}