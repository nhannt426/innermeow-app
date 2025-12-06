'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function RoomScene() {
  return (
    <div className="relative w-full h-[65vh] flex items-center justify-center">
      
      {/* 1. Floating Island (Background) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-[380px] h-[380px] flex items-center justify-center"
      >
        {/* Glow effect behind the island */}
        <div className="absolute w-[200px] h-[200px] bg-indigo-500/30 rounded-full blur-[60px]" />
        
        <Image 
          src="/assets/bg-room.png"  // <-- Đã đổi sang PNG
          alt="Sanctuary Room" 
          width={400} 
          height={400}
          className="object-contain drop-shadow-2xl z-0"
          priority
        />
      </motion.div>

      {/* 2. The Cat (Breathing Animation) */}
      <motion.div
        className="absolute z-10 mb-[-40px]" // Điều chỉnh vị trí mèo ngồi lên đảo
        animate={{ 
          y: [0, -8, 0], // Nhấp nhô nhẹ
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <Image 
          src="/assets/cat-idle.png" 
          alt="My Inner Meow" 
          width={160} 
          height={160}
          className="object-contain drop-shadow-xl"
        />
      </motion.div>
    </div>
  );
}