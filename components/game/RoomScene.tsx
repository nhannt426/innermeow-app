'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useGameSound } from '@/hooks/useGameSound';
import CatController from './CatController';
import DecorLayer from '@/components/game/DecorLayer'; // Import component DecorLayer mới
import FloatingBubble from './FloatingBubble'; // ✅ Import component mới
import { useGameStore } from '@/store/useGameStore'; // Import useGameStore

// --- CONFIGURATION ---
const BUBBLE_GEN_RATE_MS = 3000;
const SCREEN_BUBBLE_LIMIT = 6;

interface RoomSceneProps {
  onInteractSuccess?: (reward: number, type: string, x: number, y: number) => void;
}

export default function RoomScene({ onInteractSuccess }: RoomSceneProps) {
  // Lấy từng state nguyên thủy để tránh re-render loop
  const sanctuary_level = useGameStore((state) => state.sanctuary_level);
  const happiness = useGameStore((state) => state.happiness);
  const userData = useGameStore((state) => state.userData);
  const catAction = useGameStore((state) => state.catAction);
  
  // Tính toán các giá trị dẫn xuất từ state
  const maxHappiness = userData ? 10 + userData.energy_level : 10;
  const isSleeping = catAction === 'SLEEP';

  // Component tự quản lý state bong bóng
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastBubbleTimeRef = useRef<number>(Date.now());
  
  const catRef = useRef<HTMLDivElement>(null);
  const { playPop } = useGameSound();
  const bgImageSrc = `/assets/rooms/bg_lv${sanctuary_level}.webp`;

  // Game loop cục bộ chỉ để sinh bong bóng
  useEffect(() => {
    const bubbleLoop = setInterval(() => {
      const now = Date.now();
      if (now - lastBubbleTimeRef.current > BUBBLE_GEN_RATE_MS) {
        setBubbles(prev => {
          if (isSleeping) return prev;
          
          const remainingHappinessSlots = maxHappiness - happiness;
          const currentDynamicCap = Math.min(SCREEN_BUBBLE_LIMIT, remainingHappinessSlots + 1);
          if (prev.length >= currentDynamicCap) return prev;
          
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

    return () => clearInterval(bubbleLoop);
  }, [maxHappiness, happiness, isSleeping]);

  // Xử lý khi người dùng click vào bong bóng
  const handleBubbleClick = (bubble: { id: number; x: number; y: number }) => {
    playPop();
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    if (onInteractSuccess) {
      const baseReward = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
      onInteractSuccess(baseReward, 'coin', bubble.x, bubble.y);
    }
  };

  return (
    <div className="relative w-full h-[65vh] mt-6 flex items-center justify-center select-none touch-none">
      
      {/* LAYER 0: Background Image */}
      <motion.div 
        // Thêm key để React biết phải render lại khi đổi ảnh (tạo hiệu ứng chuyển cảnh mượt nếu muốn)
        key={sanctuary_level} 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
            opacity: { duration: 1 }
        }}
        className="relative w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[220px] h-[220px] bg-game-primary/20 rounded-full blur-[80px]" />
        
        {/* Dùng biến bgImageSrc */}
        <Image 
            src={bgImageSrc} 
            alt={`Sanctuary Level ${sanctuary_level}`} 
            width={380} 
            height={380} 
            className="object-contain drop-shadow-2xl z-0" 
            priority 
        />
      </motion.div>
      
      {/* LAYER 0.5: Decor Tường */}
      <DecorLayer layer="wall" />

      {/* LAYER 1: Decor Sàn (Thảm) */}
      <DecorLayer layer="rug" />

      {/* LAYER 2: Cat Controller */}
      <CatController ref={catRef} />

      {/* LAYER 3: Decor Nội thất (Giường, Bát, Cây, Đồ chơi) */}
      <DecorLayer layer="bed" />
      <DecorLayer layer="bowl" />
      <DecorLayer layer="plant" />
      <DecorLayer layer="toy" />

      {/* Floating Bubbles */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => handleBubbleClick(b)} />
        ))}
      </AnimatePresence>
    </div>
  );
}