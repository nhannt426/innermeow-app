'use client';

import { useEffect, useRef } from 'react';
import { TRAVEL_MAPS } from '@/constants/travelData';
import { ArrowLeft } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';

interface TravelSceneProps {
  mapId: string;
  bubbles: { id: number; x: number; y: number }[]; // Nhận bong bóng từ GameClient
  onPopBubble: (id: number) => void;
  onExit: () => void;
}

export default function TravelScene({ mapId, bubbles, onPopBubble, onExit }: TravelSceneProps) {
  const { playUi } = useGameSound();
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
            <div
                key={bubble.id}
                className="absolute w-20 h-20 cursor-pointer animate-float-fast hover:scale-110 active:scale-90 transition-transform touch-manipulation z-30"
                style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
                onPointerDown={(e) => {
                    e.preventDefault(); // Ngăn zoom/scroll
                    onPopBubble(bubble.id);
                }}
            >
                {/* Bong bóng Travel có thể khác bong bóng thường nếu muốn (ví dụ màu khác) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="/assets/bubble.webp" 
                    alt="bubble" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                    draggable={false}
                />
            </div>
        ))}
    </div>
  );
}