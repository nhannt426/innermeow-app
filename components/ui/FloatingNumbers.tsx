'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  value: number | string; // Cho phép nhận string (ví dụ "+1")
  type?: 'normal' | 'bonus' | 'fragment'; // Thêm type 'fragment'
  imgSrc?: string; // ✅ NEW: Đường dẫn ảnh vật phẩm
}

export default function FloatingNumbers({ texts }: { texts: FloatingText[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {texts.map((text) => {
          const isBonus = text.type === 'bonus';
          const isFragment = text.type === 'fragment';

          return (
            <motion.div
              key={text.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ 
                  opacity: 1, 
                  y: -100, 
                  scale: isBonus ? 1.5 : 1.2 
              }}
              exit={{ opacity: 0, y: -150, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute flex flex-col items-center justify-center"
              style={{ left: text.x, top: text.y }}
            >
              <div className="relative flex items-center gap-2">
                  {/* Fragment Text */}
                  {isFragment && (
                     <span className="text-xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
                        +1
                     </span>
                  )}

                  {/* Normal/Bonus Text (Logic cũ giữ nguyên) */}
                  {!isFragment && (
                    <div className="relative">
                        <span className={`absolute top-0.5 left-0.5 text-4xl font-black blur-[0.5px] ${isBonus ? 'text-[#4c1d95]' : 'text-[#854d0e]'}`}>
                            {typeof text.value === 'number' && text.value > 0 ? '+' : ''}{text.value}
                        </span>
                        <span 
                            className={`relative text-4xl font-black ${isBonus ? 'text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 to-purple-500' : 'text-yellow-300'}`}
                            style={{ 
                                textShadow: isBonus ? '0 4px 0 #4c1d95' : '0 2px 0 #b45309', 
                                WebkitTextStroke: '1px #fff' 
                            }}
                        >
                            {typeof text.value === 'number' && text.value > 0 ? '+' : ''}{text.value}
                        </span>
                    </div>
                  )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}