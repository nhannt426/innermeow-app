'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import HeartbeatRing from './HeartbeatRing'; // Import Component mới

interface RoomSceneProps {
  onPetSuccess: () => void;
  onCollectBubble: (id: number) => void;
  isSleeping: boolean;
  sleepUntil: number | null; // Timestamp
  bubbles: { id: number; x: number; y: number }[];
}

export default function RoomScene({ onPetSuccess, onCollectBubble, isSleeping, sleepUntil, bubbles }: RoomSceneProps) {
  
  // Logic đếm ngược
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (!isSleeping || !sleepUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = sleepUntil - now;
      if (diff <= 0) {
        setTimeLeft("Waking up...");
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSleeping, sleepUntil]);

  return (
    <div className="relative w-full h-[60vh] mt-10 flex items-center justify-center select-none touch-none">
      
      {/* Background */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[220px] h-[220px] bg-game-primary/20 rounded-full blur-[80px]" />
        <Image src="/assets/bg-room.png" alt="Room" width={380} height={380} className="object-contain drop-shadow-2xl z-0" priority />
      </motion.div>

      {/* Cat Character */}
      <motion.div
        className="absolute z-10 mb-[-30px]"
        animate={{ 
          y: [0, -5, 0],
          opacity: isSleeping ? 0.6 : 1,
          scale: isSleeping ? 0.95 : 1
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/assets/cat-idle.png" alt="Cat" width={170} height={170} className="object-contain drop-shadow-xl" draggable={false} />
      </motion.div>

      {/* --- LAYER TƯƠNG TÁC --- */}
      
      {/* 1. Nếu đang ngủ: Hiện đồng hồ */}
      {isSleeping ? (
        <div className="absolute z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
          <span className="text-3xl font-black text-white tracking-widest font-mono">{timeLeft}</span>
          <span className="text-xs text-game-primary uppercase font-bold mt-1">Recharging Energy</span>
        </div>
      ) : (
        /* 2. Nếu thức: Hiện Heartbeat Game */
        <HeartbeatRing 
          onSuccess={onPetSuccess}
          onFail={() => { /* Rung nhẹ báo fail nếu muốn */ }}
        />
      )}

      {/* Floating 3D Bubbles */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => onCollectBubble(b.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FloatingBubble({ x, y, onClick }: { x: number, y: number, onClick: () => void }) {
  const size = 50 + Math.random() * 15; 
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [y, y - 25, y], x: [x, x + 6, x] }} 
      exit={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute z-30 touch-manipulation"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    >
      <div className="relative w-full h-full drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] hover:scale-110 active:scale-90 transition-transform">
        <Image src="/assets/icons/bubble-3d.png" alt="Bubble" fill className="object-contain" />
      </div>
    </motion.button>
  )
}