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
        {clicks.map((click) => {
          // Random góc xoay nhẹ cho tự nhiên (-15 đến 15 độ)
          const randomRotate = Math.random() * 30 - 15; 
          
          return (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y - 20, x: click.x, scale: 0.5, rotate: randomRotate }}
              animate={{ opacity: 0, y: click.y - 200, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute font-black text-4xl drop-shadow-lg select-none"
              style={{ 
                left: 0, top: 0,
                // Gradient Text effect
                backgroundImage: 'linear-gradient(to bottom, #fde047, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
              }}
            >
              +{click.value}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  );
}