'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import GameClient với chế độ tắt SSR (Server-Side Rendering)
const GameClient = dynamic(() => import('@/components/game/GameClient'), {
  ssr: false, // <--- QUAN TRỌNG NHẤT: Chặn chạy trên server để fix lỗi Audio
  loading: () => (
    <div className="fixed inset-0 bg-[#1a1b26] flex flex-col items-center justify-center z-[100]">
        <Loader2 className="w-12 h-12 animate-spin text-[#a78bfa] mb-4"/>
        <p className="text-white/50 text-sm font-bold tracking-widest animate-pulse">
            ENTERING SANCTUARY...
        </p>
    </div>
  )
});

export default function Page() {
  return <GameClient />;
}