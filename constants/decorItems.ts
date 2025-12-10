// 1. ĐỊNH NGHĨA CẤU TRÚC (Types)
export type DecorType = 'bed' | 'bowl' | 'rug' | 'wall' | 'plant' | 'toy';

export interface DecorItem {
  id: string;
  type: DecorType;
  name: string;
  price: number;
  level: number;
  image: string;
}

// 2. CONFIGURATION (Cấu hình)
const LEVEL_STYLES = ['poor', 'basic', 'cozy', 'nature', 'beach', 'modern', 'city', 'sweet', 'royal', 'cyberpunk'];
export const DECOR_CATEGORIES: DecorType[] = ['bed', 'bowl', 'rug', 'wall', 'plant', 'toy'];

// 3. HÀM TÍNH GIÁ (Bậc thang)
/**
 * Tính giá vật phẩm dựa trên cấp độ theo công thức bậc thang.
 * @param level Cấp độ của vật phẩm.
 * @returns Giá tiền đã được làm tròn.
 */
const calculatePrice = (level: number): number => {
  // Level 1 là đồ mặc định, miễn phí.
  if (level === 1) return 0;

  const basePrice = 500;
  const price = basePrice * Math.pow(1.6, level - 1);
  
  // Làm tròn đến hàng chục gần nhất (e.g., 800, 1280, 2050)
  return Math.round(price / 10) * 10;
};

// 4. DATA GENERATOR (Tự động sinh)
export const ALL_DECOR_ITEMS: DecorItem[] = Array.from({ length: 10 }, (_, i) => i + 1)
  .flatMap(level => {
    const style = LEVEL_STYLES[level - 1];

    return DECOR_CATEGORIES.map(type => {
      const itemId = `${type}_lv${level}_${style}`;
      const imageUrl = `/assets/decor/${type}s/${itemId}.webp`;
      
      // Viết hoa chữ cái đầu của style và type để tạo tên
      const formattedStyle = style.charAt(0).toUpperCase() + style.slice(1);
      const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
      const itemName = `${formattedStyle} ${formattedType}`;

      return {
        id: itemId,
        type: type,
        name: itemName,
        price: calculatePrice(level),
        level: level,
        image: imageUrl,
      };
    });
  });