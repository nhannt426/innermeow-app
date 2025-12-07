'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // Giữ lại cho Background và Mèo (Tĩnh)
import { useState, useRef } from 'react';
import { GameItem, getRandomItem } from '@/lib/game-config'; 
import { useGameSound } from '@/hooks/useGameSound';

interface RoomSceneProps {
  userLevel: number;
  onInteractSuccess: (reward: number, type: string) => void;
  bubbles: { id: number; x: number; y: number }[];
  onPopBubble: (id: number) => void;
}

interface DroppedItem extends GameItem {
  instanceId: number;
  x: number;
  y: number;
}

export default function RoomScene({ userLevel, onInteractSuccess, bubbles, onPopBubble }: RoomSceneProps) {
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const catRef = useRef<HTMLDivElement>(null);
  const { playPop, playDrop, playEat } = useGameSound();

  const handleBubbleClick = (id: number, x: number, y: number) => {
    playPop();
    onPopBubble(id);
    const itemConfig = getRandomItem(userLevel);
    
    // Random nhẹ vị trí rơi xung quanh bong bóng vỡ cho tự nhiên
    const dropOffsetX = (Math.random() - 0.5) * 5; 
    setTimeout(() => playDrop(), 100);
    const newItem: DroppedItem = {
      ...itemConfig,
      instanceId: Date.now(),
      x: x + dropOffsetX, 
      y: y
    };
    setDroppedItems(prev => [...prev, newItem]);
  };

  const handleDragEnd = (event: any, info: any, item: DroppedItem) => {
    const catRect = catRef.current?.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    if (catRect) {
      // Hitbox rộng hơn chút để dễ trúng
      if (
        dropX >= catRect.left - 30 && 
        dropX <= catRect.right + 30 && 
        dropY >= catRect.top - 30 && 
        dropY <= catRect.bottom + 30
      ) {
        playEat();
        handleItemConsumed(item);
      }
    }
  };

  const handleItemConsumed = (item: DroppedItem) => {
    setDroppedItems(prev => prev.filter(i => i.instanceId !== item.instanceId));
    onInteractSuccess(item.reward, item.type);
  };

  return (
    <div className="relative w-full h-[65vh] mt-6 flex items-center justify-center select-none touch-none">
      
      {/* Background (Dùng Next Image ok vì nó tĩnh) */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[220px] h-[220px] bg-game-primary/20 rounded-full blur-[80px]" />
        <Image src="/assets/bg-room.webp" alt="Room" width={380} height={380} className="object-contain drop-shadow-2xl z-0" priority />
      </motion.div>

      {/* Cat (Drop Zone) */}
      <motion.div
        ref={catRef}
        className="absolute z-10 mb-[-30px]"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/assets/cat-idle.webp" alt="Cat" width={170} height={170} className="object-contain drop-shadow-xl pointer-events-none" />
      </motion.div>

      {/* Dropped Items (Dùng <img> thường để KHÔNG LAG) */}
      <AnimatePresence>
        {droppedItems.map((item) => (
          <DraggableItem key={item.instanceId} item={item} onDragEnd={handleDragEnd} />
        ))}
      </AnimatePresence>

      {/* Floating Bubbles */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => handleBubbleClick(b.id, b.x, b.y)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function DraggableItem({ item, onDragEnd }: { item: DroppedItem, onDragEnd: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.2, cursor: 'grabbing', zIndex: 100 }}
      onDragEnd={(e, info) => onDragEnd(e, info, item)}
      className="absolute z-20 cursor-grab touch-action-none"
      style={{ top: `${item.y}%`, left: `${item.x}%` }}
    >
      <div className="w-16 h-16 drop-shadow-lg filter hover:brightness-110">
         {/* FIX QUAN TRỌNG: Dùng thẻ img thường để load tức thì từ cache */}
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img 
            src={item.src} 
            alt={item.name} 
            className="w-full h-full object-contain pointer-events-none"
            draggable={false} // Chặn drag mặc định của trình duyệt
         />
         
         <div className="absolute -bottom-4 w-full text-center">
             <span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap border border-white/10">
                {item.name}
             </span>
         </div>
      </div>
    </motion.div>
  )
}

function FloatingBubble({ x, y, onClick }: { x: number, y: number, onClick: () => void }) {
  return (
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 1.5, opacity: 0 }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="absolute z-30 w-20 h-20 touch-manipulation" 
        style={{ 
            left: `${x}%`, 
            top: `${y}%`,
            // FIX QUAN TRỌNG: Căn giữa tâm để không bị lệch
            transform: 'translate(-50%, -50%)' 
        }}
      >
        <div className="relative w-full h-full animate-float drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="/assets/icons/bubble-3d.webp" alt="Bubble" className="w-full h-full object-contain" draggable={false} />
        </div>
      </motion.button>
  )
}