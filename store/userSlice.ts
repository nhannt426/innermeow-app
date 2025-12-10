import { StateCreator } from 'zustand';

// Định nghĩa lại UserData interface ở đây để slice có thể sử dụng
export interface UserData {
  id: string;
  telegram_id: number;
  first_name: string;
  coins: number;
  gems?: number;
  click_level: number;
  energy_level: number;
  sanctuary_level: number;
  sleep_until: string | null;
  daily_limits?: {
    premium_ad_watch_count: number;
    last_reset: string | null;
  };
  // ... và các trường khác từ DB
  [key: string]: any; // Cho phép các thuộc tính khác
}

export interface EquippedDecor {
  bed: string | null;
  bowl: string | null;
  rug: string | null;
  wall: string | null;
  plant: string | null;
  toy: string | null;
}

export interface UserSlice {
  // --- State ---
  coins: number;
  memoryDust: number;
  inventory: Record<string, number>; // Ví dụ: { 'coffee': 2, 'ticket': 5 }
  fragments: Record<string, number>; // Ví dụ: { 'skin_galaxy_part1': 1 }
  equippedDecor: EquippedDecor;
  userData: UserData | null;
  sanctuary_level: number;
  happiness: number;

  // --- Actions ---
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  addItemToInventory: (itemId: string, amount: number) => void;
  useCoffee: () => boolean; // Trả về true nếu dùng thành công
  setUserData: (data: UserData) => void;
  setEquippedDecor: (category: keyof EquippedDecor, itemId: string | null) => void;
  setHappiness: (value: number) => void;
  increaseHappiness: (amount: number) => void;
  decreaseHappiness: (amount: number) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  // --- Initial State ---
  coins: 0,
  memoryDust: 0,
  // ✅ 1. Cập nhật inventory với các item mặc định
  inventory: {
    'bed_lv1_carton': 1,
    'bowl_lv1_chipped': 1,
    'rug_lv1_newspaper': 1,
    'wall_lv1_broken_frame': 1,
    'plant_lv1_dead_weed': 1,
    'toy_lv1_tangled_yarn': 1,
  },
  fragments: {},
  // ✅ 2. Tự động trang bị các item mặc định (lưu ý: chỉ lưu id không có prefix)
  equippedDecor: { 
    bed: 'lv1_carton', 
    bowl: 'lv1_chipped', 
    rug: 'lv1_newspaper', 
    wall: 'lv1_broken_frame', 
    plant: 'lv1_dead_weed', 
    toy: 'lv1_tangled_yarn' },
  userData: null,
  sanctuary_level: 1,
  happiness: 0,

  // --- Actions Implementation ---
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  spendCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins - amount) })),
  addItemToInventory: (itemId, amount) => set((state) => {
    const newInventory = { ...state.inventory };
    newInventory[itemId] = (newInventory[itemId] || 0) + amount;
    return { inventory: newInventory };
  }),
  useCoffee: () => {
    const currentCoffee = get().inventory['coffee'] || 0;
    if (currentCoffee > 0) {
      set((state) => ({
        inventory: { ...state.inventory, coffee: state.inventory['coffee'] - 1 }
      }));
      return true; // Dùng thành công
    }
    return false; // Không đủ cà phê
  },
  setUserData: (data) => set({
    userData: data,
    coins: data.coins,
    memoryDust: data.memory_dust,
    sanctuary_level: data.sanctuary_level || 1,
    // Giả định inventory được lưu dưới dạng JSON trong DB hoặc cần được xử lý riêng
    // inventory: data.inventory || {},
  }),
  setEquippedDecor: (category, itemId) => set((state) => ({
    equippedDecor: { ...state.equippedDecor, [category]: itemId }
  })),
  setHappiness: (value) => set({ happiness: value }),
  increaseHappiness: (amount) => set((state) => ({ happiness: state.happiness + amount })),
  decreaseHappiness: (amount) => set((state) => ({ happiness: Math.max(0, state.happiness - amount) })),
});