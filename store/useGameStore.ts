import { create } from 'zustand';
import { createUserSlice, UserSlice } from './userSlice';
import { createCatSlice, CatState } from './catSlice';
import { createSocialSlice, SocialState } from './socialSlice';

/**
 * Gộp tất cả các interface của các slice lại thành một GameState duy nhất.
 * Điều này cho phép truy cập tất cả state từ một store duy nhất, ví dụ:
 * const coins = useGameStore(state => state.coins);
 * const catAction = useGameStore(state => state.catAction);
 */
type GameState = UserSlice & CatState & SocialState;

// Sử dụng pattern kết hợp các slice creator.
// Mỗi hàm create...Slice sẽ nhận vào các tham số (set, get, api) từ Zustand.
export const useGameStore = create<GameState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCatSlice(...a),
  ...createSocialSlice(...a),
}));