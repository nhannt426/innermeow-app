export type Rarity = 'common' | 'rare' | 'epic';

export interface TravelItem {
  id: string;
  name: string;
  rarity: Rarity;
  fragmentsRequired: number; // Số mảnh cần để ghép
  dropRate: number; // Tỷ lệ rơi (0-1)
}

export interface TravelMap {
  id: string;
  name: string;
  bgVideo: string;
  bgImage: string;
  bgm: string; // Tên file âm thanh ASMR
  items: TravelItem[];
}

export const TRAVEL_MAPS: TravelMap[] = [
  {
    id: 'beach',
    name: 'Sunny Beach',
    bgVideo: '/assets/travel/bg-beach.webm',
    bgImage: '/assets/travel/bg-beach.webp',
    bgm: '/assets/sounds/bgm-beach.webm',
    items: [
      { id: 'seashell', name: 'Pink Seashell', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'starfish', name: 'Orange Starfish', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'coconut', name: 'Fresh Coconut', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.15 },
      { id: 'goggles', name: 'Diving Goggles', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.10 },
      { id: 'pearl', name: 'White Pearl', rarity: 'epic', fragmentsRequired: 16, dropRate: 0.05 },
    ]
  },
  {
    id: 'forest',
    name: 'Mystic Forest',
    bgVideo: '/assets/travel/bg-forest.webm',
    bgImage: '/assets/travel/bg-forest.webp',
    bgm: '/assets/sounds/bgm-forest.webm',
    items: [
      { id: 'pinecone', name: 'Brown Pinecone', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'mushroom', name: 'Glowing Shroom', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'clover', name: '4-Leaf Clover', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.15 },
      { id: 'crystal', name: 'Raw Crystal', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.10 },
      { id: 'feather', name: 'Phoenix Feather', rarity: 'epic', fragmentsRequired: 16, dropRate: 0.05 },
    ]
  },
  {
    id: 'city',
    name: 'Cyber City',
    bgVideo: '/assets/travel/bg-city.webm',
    bgImage: '/assets/travel/bg-city.webp',
    bgm: '/assets/sounds/bgm-city.webm',
    items: [
      { id: 'disk', name: 'Floppy Disk', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'soda', name: 'Neon Soda', rarity: 'common', fragmentsRequired: 4, dropRate: 0.35 },
      { id: 'console', name: 'Retro Console', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.15 },
      { id: 'robot', name: 'Mini Robot', rarity: 'rare', fragmentsRequired: 9, dropRate: 0.10 },
      { id: 'vr', name: 'VR Headset', rarity: 'epic', fragmentsRequired: 16, dropRate: 0.05 },
    ]
  }
];

// Hàm helper để random item dựa trên drop rate
export const getRandomTravelDrop = (mapId: string): TravelItem | null => {
  const map = TRAVEL_MAPS.find(m => m.id === mapId);
  if (!map) return null;

  const rand = Math.random();
  let cumulative = 0;
  
  for (const item of map.items) {
    cumulative += item.dropRate;
    if (rand < cumulative) {
      return item;
    }
  }
  return map.items[0]; // Fallback
};