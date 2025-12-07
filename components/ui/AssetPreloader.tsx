'use client';

import Image from 'next/image';
import { GAME_ITEMS } from '@/lib/game-config'; // Import file config vật phẩm của bạn

export default function AssetPreloader() {
  return (
    <div className="hidden" style={{ display: 'none' }}>
      {/* Load trước toàn bộ Item trong Shop/Drop list */}
      {GAME_ITEMS.map((item) => (
        <Image 
          key={item.id}
          src={item.src} 
          alt="preload"
          width={1} 
          height={1}
          priority={true} // Bắt buộc tải ngay lập tức
          unoptimized // Bỏ qua tối ưu của Next.js để load file gốc nhanh nhất (tuỳ chọn)
        />
      ))}
      
      {/* Load trước các icon quan trọng khác nếu cần */}
      <Image src="/assets/icons/star-3d.webp" alt="p" width={1} height={1} priority />
      <Image src="/assets/icons/heart-3d.webp" alt="p" width={1} height={1} priority />
      <Image src="/assets/icons/bubble-3d.webp" alt="p" width={1} height={1} priority />
    </div>
  );
}