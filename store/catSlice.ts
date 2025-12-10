import { StateCreator } from 'zustand';

// Định nghĩa các hành động của mèo để tái sử dụng và đảm bảo type-safety
export type CatAction = 'IDLE' | 'WALK' | 'SLEEP' | 'EAT' | 'POKE';

export interface CatState {
  // --- State ---
  catPosition: { x: number; y: number; z: number }; // Có Z để sau này làm 3D chiều sâu
  catAction: CatAction; // 3D Animator sẽ dùng cái này
  sleepUntil: number | null;
  currentSkin: string; // Ví dụ: 'skin_default' hoặc 'skin_galaxy'

  // --- Actions ---
  setCatAction: (action: CatAction) => void;
  setSleepUntil: (time: number | null) => void;
  moveTo: (x: number, y: number) => void;
}

export const createCatSlice: StateCreator<CatState> = (set) => ({
  // --- Initial State ---
  catPosition: { x: 0, y: 0, z: 0 },
  catAction: 'IDLE',
  sleepUntil: null,
  currentSkin: 'skin_default', // Skin mặc định khi bắt đầu

  // --- Actions Implementation ---
  setCatAction: (action) => set({ catAction: action }),
  setSleepUntil: (time) => set({ sleepUntil: time }),

  // Di chuyển trên mặt phẳng 2D, giữ nguyên z
  moveTo: (x, y) => set((state) => ({ catPosition: { ...state.catPosition, x, y } })),
});
