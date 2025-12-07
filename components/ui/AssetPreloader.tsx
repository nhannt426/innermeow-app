'use client';

import { GAME_ITEMS } from '@/lib/game-config'; 

export default function AssetPreloader() {
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {/* 1. Preload toàn bộ vật phẩm có trong Config */}
      {GAME_ITEMS.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          key={item.id}
          src={item.src} 
          alt="preload"
        />
      ))}
      
      {/* 2. Preload các Assets quan trọng khác */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icons/bubble-3d.webp" alt="preload" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icons/star-3d.webp" alt="preload" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icons/heart-3d.webp" alt="preload" />
    </div>
  );
}