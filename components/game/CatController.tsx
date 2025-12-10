'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { CatAction } from '@/store/catSlice';

// Map các action của mèo tới file ảnh tương ứng.
// Sau này bạn chỉ cần thêm các file ảnh (e.g., cat-walk.webp) là được.
const catImageMap: Record<CatAction, string> = {
  IDLE: '/assets/cat-idle.webp',
  WALK: '/assets/cat-idle.webp', // Placeholder
  SLEEP: '/assets/cat-sleep.webp', // Placeholder
  EAT: '/assets/cat-idle.webp', // Placeholder
  POKE: '/assets/cat-idle.webp', // Placeholder
};

/**
 * Component này lắng nghe state của mèo từ useGameStore và render hình ảnh,
 * vị trí và animation tương ứng.
 */
const CatController = forwardRef<HTMLDivElement>((props, ref) => {
  // Lắng nghe các state liên quan đến mèo từ store
  const catAction = useGameStore((state) => state.catAction);
  const currentSkin = useGameStore((state) => state.currentSkin); // Sẽ dùng sau này
  const catPosition = useGameStore((state) => state.catPosition);

  const catImageSrc = catImageMap[catAction] || catImageMap.IDLE;

  return (
    <motion.div
      ref={ref}
      className="absolute z-10 mb-[-30px]"
      // Vị trí của mèo sẽ được điều khiển bởi store, hiện tại đang là float animation
      style={{
        left: `${catPosition.x}%`,
        top: `${catPosition.y}%`,
      }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Image src={catImageSrc} alt="Cat" width={170} height={170} className="object-contain drop-shadow-xl pointer-events-none" />
    </motion.div>
  );
});

CatController.displayName = 'CatController';

export default CatController;