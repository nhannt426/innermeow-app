'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function ClickEffects({ clicks }: { clicks: any[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 1, y: click.y - 40, x: click.x, scale: 0.5, rotate: Math.random() * 40 - 20 }}
            animate={{ opacity: 0, y: click.y - 150, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute"
            style={{ left: 0, top: 0 }}
          >
            {/* Dùng Icon Heart thay vì số */}
            <Heart size={32} className="text-game-love fill-game-love drop-shadow-md" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}