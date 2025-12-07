'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // Nhớ import Image
import { useState } from 'react';

interface RoomSceneProps {
  onPet: (e: React.MouseEvent | React.TouchEvent) => void;
  onCollectBubble: (id: number) => void;
  isSleeping: boolean;
  bubbles: { id: number; x: number; y: number }[];
}

export default function RoomScene({ onPet, onCollectBubble, isSleeping, bubbles }: RoomSceneProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: any) => {
    if (isSleeping) return;
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
        <Image 
          src="/assets/bg-room.png" 
          alt="Room" 
          width={380} 
          height={380} 
          className="object-contain drop-shadow-2xl z-0" 
          priority 
        />
      </motion.div>

      {/* 2. Cat Character */}
      <motion.div
        className="absolute z-10 mb-[-30px] cursor-pointer"
        animate={{ 
          y: isPressed ? 10 : 0, 
          scale: isPressed ? 0.95 : 1,
          opacity: isSleeping ? 0.8 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerDown={handlePointerDown}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
      >
        <Image 
          src="/assets/cat-idle.png" 
          alt="Cat" 
          width={170} 
          height={170} 
          className="object-contain drop-shadow-xl pointer-events-auto" 
          draggable={false} 
        />
        
        {/* Sleeping Status */}
        {isSleeping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 right-0 -mt-4 -mr-4 bg-white text-game-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          >
            Zzz...
          </motion.div>
        )}
      </motion.div>

      {/* 3. Floating Bubbles (3D Image) */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => onCollectBubble(b.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Component Bong Bóng 3D
function FloatingBubble({ x, y, onClick }: { x: number, y: number, onClick: () => void }) {
  // Random kích thước bong bóng một chút cho tự nhiên (48px - 64px)
  const size = 48 + Math.random() * 16; 
  
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: [y, y - 30, y], // Bay lên cao hơn xíu rồi xuống
        x: [x, x + 5, x - 5, x] // Lắc lư qua lại nhẹ nhàng
      }} 
      exit={{ scale: 1.5, opacity: 0 }} // Nổ to ra khi biến mất
      transition={{ 
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute z-30 touch-manipulation" // touch-manipulation giúp tap nhạy hơn trên mobile
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        width: size,
        height: size
      }}
    >
      {/* 3D Bubble Image */}
      <div className="relative w-full h-full drop-shadow-[0_0_10px_rgba(45,212,191,0.4)] hover:scale-110 active:scale-90 transition-transform duration-200">
        <Image 
          src="/assets/icons/bubble-3d.png"
          alt="Dream Bubble"
          fill
          className="object-contain"
        />
      </div>
    </motion.button>
  )
}