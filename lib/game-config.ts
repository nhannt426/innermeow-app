export type ItemType = 'food' | 'toy' | 'groom';

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  src: string;
  minLevel: number; // Level tối thiểu để rớt món này
  reward: number;   // Số Stars nhận được khi dùng
}

export const GAME_ITEMS: GameItem[] = [
  // --- LEVEL 1 (BASIC) ---
  { id: 'food-1', name: 'Fish Cookie', type: 'food', src: '/assets/items/item-food-1.png', minLevel: 1, reward: 15 },
  { id: 'toy-1', name: 'Wool Ball', type: 'toy', src: '/assets/items/item-toy-1.png', minLevel: 1, reward: 20 },
  { id: 'brush-1', name: 'Basic Brush', type: 'groom', src: '/assets/items/item-brush-1.png', minLevel: 1, reward: 25 },

  // --- LEVEL 5 (ADVANCED) - Sau này bạn chỉnh minLevel lên 5
  { id: 'food-2', name: 'Salmon Sushi', type: 'food', src: '/assets/items/item-food-2.png', minLevel: 1, reward: 40 }, 
  { id: 'toy-2', name: 'Feather Wand', type: 'toy', src: '/assets/items/item-toy-2.png', minLevel: 1, reward: 50 },
  { id: 'brush-2', name: 'Red Bowtie', type: 'groom', src: '/assets/items/item-brush-2.png', minLevel: 1, reward: 60 },
];

// Hàm random item dựa trên level hiện tại của User
export const getRandomItem = (userLevel: number): GameItem => {
  // Lọc ra các item mà user đủ level để nhặt
  const availableItems = GAME_ITEMS.filter(item => item.minLevel <= userLevel);
  
  // Random chọn 1
  const randomIndex = Math.floor(Math.random() * availableItems.length);
  return availableItems[randomIndex];
};