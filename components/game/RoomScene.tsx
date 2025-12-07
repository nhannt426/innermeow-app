'use client';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { GameItem, getRandomItem } from '@/lib/game-config'; // Import config

interface RoomSceneProps {
  userLevel: number; // Dùng để random đồ xịn hay dỏm
  onInteractSuccess: (reward: number, type: string) => void;
  bubbles: { id: number; x: number; y: number }[];
  onPopBubble: (id: number) => void;
}

// Định nghĩa vật phẩm đang rơi trên sàn
interface DroppedItem extends GameItem {
  instanceId: number; // ID riêng cho từng lần rớt
  x: number;
  y: number;
}

export default function RoomScene({ userLevel, onInteractSuccess, bubbles, onPopBubble }: RoomSceneProps) {
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const catRef = useRef<HTMLDivElement>(null); // Để xác định vị trí mèo

  // Xử lý khi bấm vỡ bong bóng
  const handleBubbleClick = (id: number, x: number, y: number) => {
    onPopBubble(id); // Xóa bong bóng
    
    // Random ra vật phẩm
    const itemConfig = getRandomItem(userLevel);
    const newItem: DroppedItem = {
      ...itemConfig,
      instanceId: Date.now(),
      x: x, // Rớt ngay tại vị trí bong bóng
      y: y
    };
    
    setDroppedItems(prev => [...prev, newItem]);
  };

  // Xử lý khi thả vật phẩm (Drag End)
  const handleDragEnd = (event: any, info: any, item: DroppedItem) => {
    // Lấy vị trí con mèo
    const catRect = catRef.current?.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    if (catRect) {
      // Kiểm tra va chạm (Collision Detection)
      // Nếu điểm thả nằm trong vùng của con mèo
      if (
        dropX >= catRect.left && 
        dropX <= catRect.right && 
        dropY >= catRect.top && 
        dropY <= catRect.bottom
      ) {
        // TRÚNG MÈO!
        handleItemConsumed(item);
      }
    }
  };

  const handleItemConsumed = (item: DroppedItem) => {
    // 1. Xóa vật phẩm khỏi sàn
    setDroppedItems(prev => prev.filter(i => i.instanceId !== item.instanceId));
    
    // 2. Gọi hàm Success để cộng tiền & hiện tim
    onInteractSuccess(item.reward, item.type);
  };

  return (
    <div className="relative w-full h-[65vh] mt-6 flex items-center justify-center select-none touch-none">
      
      {/* Background */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[220px] h-[220px] bg-game-primary/20 rounded-full blur-[80px]" />
        <Image src="/assets/bg-room.png" alt="Room" width={380} height={380} className="object-contain drop-shadow-2xl z-0" priority />
      </motion.div>

      {/* --- CAT CHARACTER (DROP ZONE) --- */}
      <motion.div
        ref={catRef} // Gắn ref để bắt va chạm
        className="absolute z-10 mb-[-30px]"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/assets/cat-idle.png" alt="Cat" width={170} height={170} className="object-contain drop-shadow-xl pointer-events-none" />
      </motion.div>

      {/* --- DROPPED ITEMS (DRAGGABLE) --- */}
      <AnimatePresence>
        {droppedItems.map((item) => (
          <DraggableItem 
            key={item.instanceId} 
            item={item} 
            onDragEnd={handleDragEnd} 
          />
        ))}
      </AnimatePresence>

      {/* --- FLOATING BUBBLES --- */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} x={b.x} y={b.y} onClick={() => handleBubbleClick(b.id, b.x, b.y)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Component Item Kéo Thả
function DraggableItem({ item, onDragEnd }: { item: DroppedItem, onDragEnd: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }} // Rớt xuống sàn
      exit={{ opacity: 0, scale: 0.5 }}
      drag
      dragMomentum={false} // Thả là dừng, không trượt
      whileDrag={{ scale: 1.2, cursor: 'grabbing', zIndex: 50 }}
      onDragEnd={(e, info) => onDragEnd(e, info, item)}
      className="absolute z-20 cursor-grab touch-action-none"
      // Vì logic tọa độ kéo thả hơi phức tạp, ta dùng trick CSS để định vị ban đầu
      // Lưu ý: Logic này demo, thực tế cần tính toán pixel chính xác hơn nếu muốn rớt đúng chỗ bóng vỡ
      style={{ bottom: '10%', left: `${item.x}%` }} 
    >
      <div className="w-16 h-16 drop-shadow-lg filter hover:brightness-110">
         <Image src={item.src} alt={item.name} width={64} height={64} className="object-contain" />
         {/* Nhãn tên item nhỏ */}
         <div className="absolute -bottom-4 w-full text-center">
             <span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                {item.name}
             </span>
         </div>
      </div>
    </motion.div>
  )
}

// Component Bong Bóng (Giữ nguyên logic cũ nhưng chỉnh vị trí Spawn ở cha)
function FloatingBubble({ x, y, onClick }: { x: number, y: number, onClick: () => void }) {
  // ... (Code cũ giữ nguyên, chỉ đảm bảo onClick hoạt động)
  return (
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 1.5, opacity: 0 }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="absolute z-30 w-16 h-16" // To hơn (64px)
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div className="relative w-full h-full animate-float drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            <Image src="/assets/icons/bubble-3d.png" alt="Bubble" fill className="object-contain" />
        </div>
      </motion.button>
  )
}