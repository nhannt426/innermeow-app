'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function ClickEffects({ clicks }: { clicks: ClickEffect[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 1, y: click.y, x: click.x, scale: 0.5 }}
            animate={{ opacity: 0, y: click.y - 150, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute font-bold text-2xl text-yellow-300 drop-shadow-md"
            style={{ left: 0, top: 0 }} // Reset position to handle absolute coordinates
          >
            +{click.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}