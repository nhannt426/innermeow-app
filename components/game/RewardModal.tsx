'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameSound } from '@/hooks/useGameSound';
// import Image from 'next/image'; // <-- Không cần cái này nữa nếu dùng thẻ img thường

export interface RewardItem {
  type: 'ticket' | 'coffee' | 'wealth' | 'luck' | 'jackpot';
  count: number;
}

interface RewardModalProps {
  isOpen: boolean;
  rewards: string[];
  onClose: () => void;
}

export default function RewardModal({ isOpen, rewards, onClose }: RewardModalProps) {
  const { playSuccess, playUi } = useGameSound();

  // Gom nhóm rewards
  const groupedRewards = rewards.reduce((acc, curr) => {
    const existing = acc.find(i => i.type === curr);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type: curr as any, count: 1 });
    }
    return acc;
  }, [] as { type: string, count: number }[]);

  // ✅ CẬP NHẬT: Hàm trả về đường dẫn ảnh (img) thay vì icon Lucide
  // Đảm bảo bạn đã có đủ 5 ảnh này trong thư mục public/assets/shop/ (hoặc đường dẫn bạn chọn)
  const getRewardDetails = (type: string) => {
    switch(type) {
      case 'ticket': 
        return { name: "Travel Ticket", img: "/assets/shop/shop-ticket.webp", color: "bg-blue-500/20 border-blue-500/50" };
      case 'coffee': 
        return { name: "Instant Coffee", img: "/assets/shop/shop-coffee.webp", color: "bg-amber-600/20 border-amber-500/50" };
      case 'wealth': 
        return { name: "Wealth Potion", desc: "(+20 Charges)", img: "/assets/shop/reward-wealth.webp", color: "bg-yellow-500/20 border-yellow-500/50" };
      case 'luck': 
        return { name: "Luck Potion", desc: "(+20 Charges)", img: "/assets/shop/reward-luck.webp", color: "bg-green-500/20 border-green-500/50" };
      case 'jackpot': 
        return { name: "JACKPOT!", desc: "+10,000 Stars", img: "/assets/shop/reward-jackpot.webp", color: "bg-purple-500/20 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.6)]" };
      default: 
        return { name: "Unknown", img: "", color: "bg-slate-500/20" };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop tối màu */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Chính */}
            <motion.div 
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
                // ✅ REVERT BACKGROUND: Quay lại dùng nền tối CSS
                className="relative w-full max-w-sm bg-[#1e1f2e] border border-white/20 rounded-[40px] p-8 shadow-2xl flex flex-col items-center overflow-hidden z-50"
            >
                {/* Ánh sáng xoay phía sau (Giữ lại cho đẹp) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />

                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg uppercase italic tracking-wider relative z-10">
                    Mystery Unlocked!
                </h2>
                <p className="text-slate-400 text-sm mb-6 relative z-10">Look what you found inside...</p>

                {/* Grid hiển thị vật phẩm */}
                <div className={`grid gap-4 w-full mb-8 relative z-10 ${groupedRewards.length > 4 ? 'grid-cols-3' : groupedRewards.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {groupedRewards.map((item, index) => {
                        const details = getRewardDetails(item.type);
                        return (
                            <motion.div 
                                key={item.type}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: index * 0.1, type: "spring" }}
                                className={`flex flex-col items-center justify-center p-3 rounded-3xl border ${details.color} backdrop-blur-sm bg-black/20`}
                            >
                                {/* ✅ Dùng thẻ img để hiển thị ảnh 3D */}
                                <div className="mb-2 animate-bounce-slow drop-shadow-lg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={details.img} alt={details.name} className="w-16 h-16 object-contain" />
                                </div>

                                <div className="text-white font-black text-lg text-center leading-tight">
                                    {item.type === 'wealth' || item.type === 'luck' 
                                        ? `x${item.count*20}` // Hiển thị tổng charges
                                        : `x${item.count}` // Hiển thị số lượng item
                                    }
                                    {(item.type === 'wealth' || item.type === 'luck') && <span className="text-[10px] block font-normal opacity-70">Charges</span>}
                                </div>
                                <div className="text-[10px] text-slate-300 font-bold uppercase mt-1 tracking-wide text-center">
                                    {details.name}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                <button 
                    onClick={() => { playUi(); onClose(); }}
                    className="relative z-10 w-full py-4 bg-gradient-to-r from-game-primary to-purple-600 rounded-2xl font-black text-white text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                    AWESOME!
                </button>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}