// lib/game-config.ts

export interface GameItem {
  id: string;
  name: string;
  type: 'food' | 'toy' | 'decoration' | 'tool';
  src: string;
  reward: number;
  rarity: 'common' | 'rare' | 'epic';
}

// --- 1. DANH SÁCH ITEMS THEO ĐỘ HIẾM ---

// NHÓM COMMON (5 món) - Thưởng: 15-30 xu
const COMMON_ITEMS: GameItem[] = [
  { 
    id: 'c1', name: 'Fish Biscuit', type: 'food', 
    src: '/assets/items/item-food-1.webp', reward: 15, rarity: 'common' 
  },
  { 
    id: 'c2', name: 'Pink Yarn Ball', type: 'toy', 
    src: '/assets/items/item-toy-1.webp', reward: 20, rarity: 'common' 
  },
  { 
    id: 'c3', name: 'Feather Wand', type: 'toy', 
    src: '/assets/items/item-toy-2.webp', reward: 25, rarity: 'common' 
  },
  { 
    id: 'c4', name: 'Bowl of Milk', type: 'food', 
    src: '/assets/items/item-food-3.webp', reward: 25, rarity: 'common' 
  },
  { 
    id: 'c5', name: 'Canned Food', type: 'food', 
    src: '/assets/items/item-food-4.webp', reward: 30, rarity: 'common' 
  },
];

// NHÓM RARE (5 món) - Thưởng: 60-100 xu
const RARE_ITEMS: GameItem[] = [
  { 
    id: 'r1', name: 'Salmon Sushi', type: 'food', 
    src: '/assets/items/item-food-2.webp', reward: 60, rarity: 'rare' 
  },
  { 
    id: 'r2', name: 'Soft Brush', type: 'tool', 
    src: '/assets/items/item-brush-1.webp', reward: 70, rarity: 'rare' 
  },
  { 
    id: 'r3', name: 'Red Bow Tie', type: 'decoration', 
    src: '/assets/items/item-brush-2.webp', reward: 80, rarity: 'rare' 
  },
  { 
    id: 'r4', name: 'Wind-up Mouse', type: 'toy', 
    src: '/assets/items/item-toy-3.webp', reward: 90, rarity: 'rare' 
  },
  { 
    id: 'r5', name: 'Catnip Pouch', type: 'food', 
    src: '/assets/items/item-toy-4.webp', reward: 100, rarity: 'rare' 
  },
];

// NHÓM EPIC (2 món) - Thưởng: 300-500 xu
const EPIC_ITEMS: GameItem[] = [
  { 
    id: 'e1', name: 'Millionaire Shades', type: 'decoration', 
    src: '/assets/items/item-epic-1.webp', reward: 350, rarity: 'epic' 
  },
  { 
    id: 'e2', name: 'Royal Crown', type: 'decoration', 
    src: '/assets/items/item-epic-2.webp', reward: 500, rarity: 'epic' 
  },
];

// Gộp tất cả để preload ảnh nếu cần
export const GAME_ITEMS = [...COMMON_ITEMS, ...RARE_ITEMS, ...EPIC_ITEMS];

// --- 2. THUẬT TOÁN DROP ITEM (Gift Quality Logic) ---

export const getRandomItem = (level: number): GameItem => {
  const roll = Math.random(); // Random từ 0.00 đến 1.00

  // CÔNG THỨC TỶ LỆ RỚT ĐỒ:
  // - Epic Chance: Level 1 = 0%, Level 5 = 1%, Level 20 = 16%
  // - Rare Chance: Level 1 = 5%, Level 20 = 45%
  // - Common: Phần còn lại
  
  const epicChance = Math.max(0, (level - 4) * 0.01); // Mỗi level tăng 1% cơ hội Epic (bắt đầu từ lv5)
  const rareChance = 0.05 + (level * 0.02); // Mỗi level tăng 2% cơ hội Rare

  // 1. Check Epic trước (Khó nhất)
  if (roll < epicChance) {
    return EPIC_ITEMS[Math.floor(Math.random() * EPIC_ITEMS.length)];
  }
  
  // 2. Check Rare
  // Ví dụ: Epic 10%, Rare 40% -> Tổng ngưỡng là 0.5
  if (roll < epicChance + rareChance) {
    return RARE_ITEMS[Math.floor(Math.random() * RARE_ITEMS.length)];
  }

  // 3. Còn lại là Common
  return COMMON_ITEMS[Math.floor(Math.random() * COMMON_ITEMS.length)];
};