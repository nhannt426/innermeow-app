'use client';

import React from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { EquippedDecor } from '@/store/userSlice';

type DecorSlot = keyof EquippedDecor;

interface DecorLayerProps {
  layer: DecorSlot;
}

/**
 * Hardcode vị trí và kích thước cho từng slot decor.
 * Bạn có thể dễ dàng tinh chỉnh các giá trị này để phù hợp với thiết kế.
 * zIndex xác định thứ tự hiển thị (số lớn hơn nằm trên).
 */
const DECOR_STYLES: Record<DecorSlot, React.CSSProperties> = {
  // Floor Layer
  rug: { position: 'absolute', zIndex: 5, top: '55%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '30%' },

  // Furniture Layer
  wall: { position: 'absolute', zIndex: 1, top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '80%' },
  bed: { position: 'absolute', zIndex: 6, bottom: '15%', left: '5%', width: '40%', height: '30%' },
  bowl: { position: 'absolute', zIndex: 7, bottom: '18%', right: '12%', width: '15%', height: '15%' },
  plant: { position: 'absolute', zIndex: 8, bottom: '35%', left: '2%', width: '20%', height: '30%' },
  toy: { position: 'absolute', zIndex: 9, bottom: '15%', left: '45%', width: '18%', height: '18%' },
};

/**
 * Helper để xây dựng đường dẫn ảnh decor.
 * Ví dụ: slot='bed', itemId='lv1_carton' -> /assets/decor/beds/bed_lv1_carton.webp
 */
const getDecorImagePath = (slot: DecorSlot, itemId: string): string => {
  // Chuyển slot thành dạng số nhiều cho tên thư mục (bed -> beds)
  const folder = `${slot}s`;
  return `/assets/decor/${folder}/${slot}_${itemId}.webp`;
};

/**
 * Component này render một layer các vật phẩm trang trí (decor).
 * Nó lấy dữ liệu từ useGameStore và hiển thị các item đã được trang bị.
 */
const DecorLayer: React.FC<DecorLayerProps> = ({ layer }) => {
  // Lấy ID của item được trang bị cho layer (slot) này từ store
  const equippedItemId = useGameStore((state) => state.equippedDecor[layer]);

  // Nếu không có item nào được trang bị cho slot này, không render gì cả
  if (!equippedItemId) {
    return null;
  }

  // Lấy style và xây dựng đường dẫn ảnh
  const style = DECOR_STYLES[layer];
  const imagePath = getDecorImagePath(layer, equippedItemId);

  return (
    <div
      key={layer}
      style={style}
      className="pointer-events-none" // Decor không cần bắt sự kiện click
    >
      <Image
        src={imagePath}
        alt={`${layer} decor`}
        fill
        className="object-contain drop-shadow-lg"
        // Ưu tiên load các ảnh lớn hoặc quan trọng
        priority={layer === 'wall' || layer === 'bed'}
        // Xử lý lỗi nếu ảnh không tồn tại
        onError={(e) => {
          // Ẩn ảnh bị lỗi để không hiển thị icon ảnh vỡ
          e.currentTarget.style.display = 'none';
          console.warn(`Decor image not found: ${imagePath}`);
        }}
      />
    </div>
  );
};

export default DecorLayer;