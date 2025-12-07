'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeartbeatRingProps {
  onSuccess: () => void;
  onFail: () => void;
}

export default function HeartbeatRing({ onSuccess, onFail }: HeartbeatRingProps) {
  const [scale, setScale] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'charging' | 'success' | 'fail'>('idle');

  // Vùng mục tiêu (Sweet Spot): Từ 0.8 đến 1.0 (80% - 100%)
  const TARGET_MIN = 0.8;
  const TARGET_MAX = 1.0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding && status === 'charging') {
      // Tăng scale dần dần khi giữ
      interval = setInterval(() => {
        setScale((prev) => {
          if (prev >= 1.2) { // Giữ quá lâu -> Nổ (Fail)
            handleRelease(1.2); 
            return 1.2;
          }
          return prev + 0.02; // Tốc độ tăng
        });
      }, 20); // 50fps smooth
    }
    return () => clearInterval(interval);
  }, [isHolding, status]);

  const handlePress = () => {
    if (status !== 'idle') return;
    setIsHolding(true);
    setStatus('charging');
    setScale(0.2); // Bắt đầu từ nhỏ
  };

  const handleRelease = (finalScale = scale) => {
    setIsHolding(false);

    if (finalScale >= TARGET_MIN && finalScale <= TARGET_MAX) {
      setStatus('success');
      setTimeout(onSuccess, 800); // Chờ animation success xong mới báo
    } else {
      setStatus('fail');
      setTimeout(onFail, 800);
    }
  };

  // Reset sau khi xong
  useEffect(() => {
    if (status === 'success' || status === 'fail') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setScale(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer touch-none"
      onMouseDown={handlePress}
      onMouseUp={() => handleRelease()}
      onMouseLeave={() => isHolding && handleRelease()}
      onTouchStart={handlePress}
      onTouchEnd={() => handleRelease()}
    >
      {/* Hướng dẫn (Chỉ hiện khi chưa bấm) */}
      {status === 'idle' && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute mt-32 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-widest pointer-events-none animate-pulse"
        >
          Hold to Sync
        </motion.div>
      )}

      {/* Vòng tròn Mục tiêu (Mờ) */}
      {status === 'charging' && (
        <div className="absolute w-[200px] h-[200px] rounded-full border-4 border-white/10 border-dashed" />
      )}

      {/* Vòng tròn Năng lượng (Chính) */}
      {status !== 'idle' && (
        <motion.div
          className={`absolute rounded-full flex items-center justify-center
            ${status === 'charging' ? 'bg-game-love/20 border-2 border-game-love shadow-[0_0_30px_rgba(244,114,182,0.4)]' : ''}
            ${status === 'success' ? 'bg-green-400/30 border-4 border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.8)]' : ''}
            ${status === 'fail' ? 'bg-red-500/30 border-4 border-red-500' : ''}
          `}
          style={{ width: 200, height: 200 }}
          animate={{ scale: scale }}
          transition={{ duration: 0 }} // Tắt transition mặc định để dùng state manual
        >
          {/* Text phản hồi */}
          {status === 'success' && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1.5 }} className="font-black text-white text-lg drop-shadow-md">
              PERFECT!
            </motion.span>
          )}
          {status === 'fail' && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="font-bold text-white text-sm">
              Miss...
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
}