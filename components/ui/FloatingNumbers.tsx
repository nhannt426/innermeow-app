'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  value: number; // Có thể là tiền hoặc text
  type?: 'normal' | 'bonus'; // ✅ NEW: Phân loại
}

export default function FloatingNumbers({ texts }: { texts: FloatingText[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {texts.map((text) => {
          const isBonus = text.type === 'bonus';

          return (
            <motion.div
              key={text.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ 
                  opacity: 1, 
                  y: isBonus ? -150 : -100, // Bonus bay cao hơn
                  scale: isBonus ? 1.5 : 1.2 // Bonus to hơn
              }}
              exit={{ opacity: 0, y: isBonus ? -200 : -150, scale: 1 }}
              transition={{ duration: isBonus ? 1.2 : 0.8, ease: "easeOut" }} // Bonus bay chậm hơn chút để ngắm
              className="absolute flex flex-col items-center"
              style={{ left: text.x, top: text.y }}
            >
              <div className="relative whitespace-nowrap">
                  {/* TEXT THƯỜNG (Vàng) */}
                  {!isBonus && (
                    <>
                        <span className="absolute top-0.5 left-0.5 text-4xl font-black text-[#854d0e] select-none blur-[0.5px]">+{text.value}</span>
                        <span className="relative text-4xl font-black text-yellow-300 select-none" style={{ textShadow: '0 2px 0 #b45309', WebkitTextStroke: '1px #fff' }}>+{text.value}</span>
                    </>
                  )}

                  {/* TEXT BONUS (Tím/Hồng + Icon) */}
                  {isBonus && (
                    <>
                        <span className="absolute top-1 left-1 text-5xl font-black text-[#4c1d95] select-none blur-[1px]">🎁 +{text.value}</span>
                        <span 
                            className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 to-purple-500 select-none" 
                            style={{ 
                                textShadow: '0 4px 0 #4c1d95', 
                                WebkitTextStroke: '1.5px #fff',
                                filter: 'drop-shadow(0 0 10px rgba(192,38,211,0.6))' // Glow effect
                            }}
                        >
                           🎁 +{text.value}
                        </span>
                    </>
                  )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}