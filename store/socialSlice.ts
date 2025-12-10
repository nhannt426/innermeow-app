import { StateCreator } from 'zustand';

export interface SocialState {
  // --- State ---
  dailyCheckInStreak: number;
  lastCheckInDate: string | null; // Format: 'YYYY-MM-DD'
  friends: string[]; // List of user IDs

  // --- Actions ---
  checkIn: () => void;
  // (Có thể thêm các action khác như addFriend, removeFriend)
}

export const createSocialSlice: StateCreator<SocialState> = (set) => ({
  // --- Initial State ---
  dailyCheckInStreak: 0,
  lastCheckInDate: null,
  friends: [],

  // --- Actions Implementation ---
  checkIn: () => set((state) => {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Nếu đã điểm danh hôm nay rồi thì không làm gì cả
    if (state.lastCheckInDate === today) {
      console.log("Already checked in today.");
      return state;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Nếu ngày điểm danh cuối là hôm qua -> tăng streak. Nếu không -> reset về 1.
    const newStreak = state.lastCheckInDate === yesterdayString ? state.dailyCheckInStreak + 1 : 1;

    return { dailyCheckInStreak: newStreak, lastCheckInDate: today };
  }),
});