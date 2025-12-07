'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface RoomSceneProps {
  onTap: (e: React.MouseEvent | React.TouchEvent) => void;
}

export default function RoomScene({ onTap }: RoomSceneProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Ngăn chặn sự kiện nổi bọt để tránh kích hoạt double trên một số máy
    e.preventDefault(); 
    setIsPressed(true);
    onTap(e);
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
  };

  return (
    <div className="relative w-full h-[65vh] flex items-center justify-center select-none touch-none">
      
      {/* 1. Background (Floating Island) */}
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

      {/* 2. Con Mèo (Tương tác Vật lý Đầm tay) */}
      <motion.div
        className="absolute z-10 mb-[-40px] cursor-pointer"
        animate={{ 
          // Khi ấn: Lún xuống 15px (sâu hơn), co lại 90% -> Cảm giác lực mạnh
          y: isPressed ? 15 : [0, -8, 0], 
          scale: isPressed ? 0.92 : 1 
        }}
        transition={{ 
          // Cấu hình lò xo "Đầm" (Damping cao để giảm rung lắc)
          type: "spring",
          stiffness: 400, // Độ cứng lò xo
          damping: 25,    // Độ hãm (càng cao càng ít tưng)
          mass: 1.2       // Trọng lượng (nặng hơn xíu)
        }}
        // Sự kiện Pointer bao gồm cả Mouse và Touch, xử lý triệt để hơn
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} // Nếu trượt tay ra ngoài thì cũng nhả ra
      >
        <Image 
          src="/assets/cat-idle.png" 
          alt="My Inner Meow" 
          width={160} 
          height={160}
          className="object-contain drop-shadow-xl pointer-events-auto"
          draggable={false} // Cấm kéo ảnh
        />
      </motion.div>
    </div>
  );
}