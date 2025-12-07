'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface RoomSceneProps {
  onPet: (e: React.MouseEvent | React.TouchEvent) => void;
  onCollectBubble: (id: number) => void;
  isSleeping: boolean;
  bubbles: { id: number; x: number; y: number }[];
}

export default function RoomScene({ onPet, onCollectBubble, isSleeping, bubbles }: RoomSceneProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: any) => {
    if (isSleeping) return; // Đang ngủ thì không vuốt được
    setIsPressed(true);
    onPet(e);
  };

  return (
    <div className="relative w-full h-[60vh] mt-10 flex items-center justify-center select-none touch-none">
      
      {/* 1. Background Island */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[220px] h-[220px] bg-game-primary/20 rounded-full blur-[80px]" />
        <Image src="/assets/bg-room.png" alt="Room" width={380} height={380} className="object-contain drop-shadow-2xl z-0" priority />
      </motion.div>

      {/* 2. Cat Character */}
      <motion.div
        className="absolute z-10 mb-[-30px] cursor-pointer"
        animate={{ 
          y: isPressed ? 10 : 0, 
          scale: isPressed ? 0.95 : 1,
          opacity: isSleeping ? 0.8 : 1 // Mờ đi xíu nếu ngủ
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerDown={handlePointerDown}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
      >
        <Image src="/assets/cat-idle.png" alt="Cat" width={170} height={170} className="object-contain drop-shadow-xl pointer-events-auto" draggable={false} />
        
        {/* Sleeping Effect (Zzz) */}
        {isSleeping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 right-0 -mt-4 -mr-4 bg-white text-game-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          >
            Zzz...
          </motion.div>
        )}
      </motion.div>

      {/* 3. Floating Bubbles (Bong bóng) */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => onCollectBubble(b.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Component Bong Bóng Nhỏ
function FloatingBubble({ x, y, onClick }: { x: number, y: number, onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [y, y - 20, y] }} // Bay lên xuống
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute w-12 h-12 bg-white/10 backdrop-blur-md rounded-full border border-game-accent/30 flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.3)] z-20 hover:scale-110 active:scale-90"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <Sparkles size={16} className="text-game-accent" />
    </motion.button>
  )
}