'use client';

import { useEffect, useRef, useState } from 'react';
import { TRAVEL_MAPS } from '@/constants/travelData';
import { ArrowLeft } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';
import FloatingBubble from './FloatingBubble'; // ✅ Import component FloatingBubble

const SCREEN_BUBBLE_LIMIT = 5;

interface TravelSceneProps {
  mapId: string;
  onInteractSuccess: (reward: number, type: string, x: number, y: number) => void;
  onExit: () => void;
}

export default function TravelScene({ mapId, onInteractSuccess, onExit }: TravelSceneProps) {
  const { playUi } = useGameSound();
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMap = TRAVEL_MAPS.find(m => m.id === mapId);

  // Logic Âm thanh ASMR
  useEffect(() => {
    if (!currentMap) return;

    // Tạo Audio
    const audio = new Audio(currentMap.bgm);
    audio.loop = true;
    audio.volume = 0.6; // Âm lượng vừa phải
    audio.play().catch(e => console.log("Auto-play blocked:", e));
    audioRef.current = audio;

    // Cleanup khi rời map
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentMap, mapId]);

  // Game loop cục bộ để sinh bong bóng
  useEffect(() => {
    const bubbleLoop = setInterval(() => {
      setBubbles(prev => {
        if (prev.length >= SCREEN_BUBBLE_LIMIT) return prev;
        const spawnX = 10 + Math.random() * 80;
        const spawnY = 20 + Math.random() * 60;
        return [...prev, { id: Date.now(), x: spawnX, y: spawnY }];
      });
    }, 2000); // Tần suất sinh bong bóng ở travel scene

    return () => clearInterval(bubbleLoop);
  }, []);

  const handleBubbleClick = (bubble: { id: number; x: number; y: number }) => {
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    // Gọi lên GameClient để xử lý logic rớt đồ
    onInteractSuccess(0, 'travel_bubble', bubble.x, bubble.y);
  };

  if (!currentMap) return null;

  return (
    <div className="relative w-full h-full overflow-hidden">
        {/* 1. BACKGROUND VIDEO LAYER */}
        <div className="absolute inset-0 -z-10">
            <video 
                autoPlay loop muted playsInline 
                className="w-full h-full object-cover"
                poster={currentMap.bgImage} // Ảnh hiện trong lúc chờ load video
            >
                <source src={currentMap.bgVideo} type="video/webm" />
                <source src={currentMap.bgVideo.replace('.webm', '.mp4')} type="video/mp4" />
            </video>
            {/* Overlay tối để bong bóng nổi bật */}
            <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* 2. UI LAYER (Nút Exit) */}
        <div className="absolute top-24 left-6 z-50">
            <button 
                onClick={() => { playUi(); onExit(); }}
                className="flex items-center gap-2 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 hover:bg-black/60 transition-all active:scale-95"
            >
                <ArrowLeft size={16} />
                <span className="text-xs font-bold">Return Home</span>
            </button>
        </div>

        {/* 3. GAMEPLAY LAYER (Bong bóng) */}
        {/* Tái sử dụng logic render bong bóng nhưng ở bối cảnh mới */}
        {bubbles.map((bubble) => (
            <FloatingBubble
              key={bubble.id}
              x={bubble.x} y={bubble.y}
              onClick={() => handleBubbleClick(bubble)}
            />
        ))}
    </div>
  );
}