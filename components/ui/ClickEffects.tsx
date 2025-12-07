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
           // Random góc xoay để nhìn tự nhiên
          const rotate = Math.random() * 20 - 10; 
          
          return (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y - 40, x: click.x, scale: 0.5, rotate: rotate }}
              animate={{ opacity: 0, y: click.y - 250, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute font-black text-5xl select-none flex items-center justify-center"
              style={{ 
                left: 0, top: 0,
                // Tạo hiệu ứng 3D bằng text-shadow
                color: '#2dd4bf', // Màu xanh Mint (Game Accent)
                WebkitTextStroke: '2px white', // Viền trắng
                textShadow: '0px 4px 0px #0f766e, 0px 8px 10px rgba(0,0,0,0.3)' // Bóng đổ khối (Màu xanh đậm hơn)
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