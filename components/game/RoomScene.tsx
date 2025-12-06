'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface RoomSceneProps {
  onTap: (e: React.MouseEvent | React.TouchEvent) => void;
}

export default function RoomScene({ onTap }: RoomSceneProps) {
  // State xử lý hiệu ứng nhún khi click
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    onTap(e);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  return (
    <div className="relative w-full h-[65vh] flex items-center justify-center select-none touch-none">
      
      {/* 1. Floating Island (Background - Không nhận click) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-[380px] h-[380px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[200px] h-[200px] bg-indigo-500/30 rounded-full blur-[60px]" />
        <Image 
          src="/assets/bg-room.png" 
          alt="Sanctuary Room" 
          width={400} 
          height={400}
          className="object-contain drop-shadow-2xl z-0"
          priority
        />
      </motion.div>

      {/* 2. The Cat (Nhận Click/Tap ở đây) */}
      <motion.div
        className="absolute z-10 mb-[-40px] cursor-pointer"
        animate={{ 
          y: isPressed ? 10 : [0, -8, 0], // Nếu đang ấn thì thụt xuống, không thì bay
          scale: isPressed ? 0.95 : 1
        }}
        transition={{ 
          y: { duration: isPressed ? 0.1 : 4, repeat: isPressed ? 0 : Infinity, ease: "easeInOut" },
          scale: { duration: 0.1 }
        }}
        // Hỗ trợ cả chuột và màn hình cảm ứng
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        <Image 
          src="/assets/cat-idle.png" 
          alt="My Inner Meow" 
          width={160} 
          height={160}
          className="object-contain drop-shadow-xl pointer-events-auto" // Quan trọng: pointer-events-auto
        />
      </motion.div>
    </div>
  );
}