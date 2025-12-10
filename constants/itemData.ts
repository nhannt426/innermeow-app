import { EquippedDecor } from "@/store/userSlice";

export type ItemCategory = keyof EquippedDecor | 'consumable';

export interface ItemData {
  id: string; // Full ID, e.g., "bed_carton"
  name: string;
  category: ItemCategory;
  imgSrc: string;
}

/**
 * Database cho tất cả các item trong game.
 * Dùng để hiển thị trong Inventory.
 */
export const ITEM_DATA: Record<string, ItemData> = {
  // Consumables
  'ticket': {
    id: 'ticket',
    name: 'Travel Ticket',
    category: 'consumable',
    imgSrc: '/assets/shop/shop-ticket.webp',
  },
  'coffee': {
    id: 'coffee',
    name: 'Strong Coffee',
    category: 'consumable',
    imgSrc: '/assets/shop/shop-coffee.webp',
  },

  // Decor Items
  'bed_carton': {
    id: 'bed_carton',
    name: 'Carton Bed',
    category: 'bed',
    imgSrc: '/assets/decor/beds/bed_carton.webp',
  },
  'rug_basic': {
    id: 'rug_basic',
    name: 'Basic Rug',
    category: 'rug',
    imgSrc: '/assets/decor/rugs/rug_basic.webp',
  },
  // ... Thêm các item decor khác của bạn vào đây
};

export const DECOR_CATEGORIES: (keyof EquippedDecor)[] = ['bed', 'bowl', 'rug', 'wall', 'plant', 'toy'];