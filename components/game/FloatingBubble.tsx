'use client';

import { motion } from 'framer-motion';

interface FloatingBubbleProps {
  x: number;
  y: number;
  onClick: () => void;
}

export default function FloatingBubble({ x, y, onClick }: FloatingBubbleProps) {
  return (
    <motion.button
      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 1.5, opacity: 0 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute z-30 w-20 h-20 touch-manipulation"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)' // Căn giữa tâm để không bị lệch
      }}
    >
      <div className="relative w-full h-full animate-float drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icons/bubble-3d.webp" alt="Bubble" className="w-full h-full object-contain" draggable={false} />
      </div>
    </motion.button>
  )
}