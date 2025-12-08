'use client';

import { motion } from 'framer-motion';
import { TRAVEL_MAPS } from '@/constants/travelData'; // File config vừa tạo
import { Ticket, Lock, MapPin } from 'lucide-react';
import { useGameSound } from '@/hooks/useGameSound';

interface TravelMenuProps {
  ticketCount: number;
  onTravel: (mapId: string) => void;
}

export default function TravelMenu({ ticketCount, onTravel }: TravelMenuProps) {
  const { playUi } = useGameSound();

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 px-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
           <h2 className="text-3xl font-black text-white drop-shadow-md">World Map 🌍</h2>
           <p className="text-slate-400 text-sm">Where do you want to go?</p>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/shop/shop-ticket.webp" alt="Ticket" className="w-5 h-5 object-contain" />
            <span className={`font-bold ${ticketCount > 0 ? 'text-white' : 'text-red-400'}`}>
                {ticketCount} Available
            </span>
        </div>
      </div>

      {/* Map List */}
      <div className="space-y-6">
        {TRAVEL_MAPS.map((map, index) => {
           // Logic khóa map (Tạm thời mở hết, sau này thêm logic level)
           const isLocked = false; 

           return (
             <motion.div
               key={map.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               className="relative w-full h-48 rounded-[30px] overflow-hidden group border border-white/10 shadow-2xl"
             >
                {/* Background Image (Fallback) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={map.bgImage} alt={map.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end items-start">
                   <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-game-primary" />
                      <span className="text-xs font-bold text-game-primary uppercase tracking-widest">Destination</span>
                   </div>
                   <h3 className="text-2xl font-black text-white mb-2">{map.name}</h3>
                   
                   <div className="w-full flex justify-between items-center">
                       {/* Drop Preview (Hiện 3 món đầu) */}
                       <div className="flex -space-x-2">
                          {map.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                  {/* Logic lấy ảnh item (Giả sử đường dẫn đúng như đã bàn) */}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={`/assets/travel/items/${map.id}/item-${item.id}.webp`} 
                                    alt={item.name} 
                                    className="w-5 h-5 object-contain" 
                                  />
                              </div>
                          ))}
                          <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-[10px] text-white font-bold backdrop-blur-sm">
                              +2
                          </div>
                       </div>

                       {/* Action Button */}
                       <button
                         onClick={() => { playUi(); !isLocked && onTravel(map.id); }}
                         disabled={isLocked || ticketCount <= 0}
                         className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                            isLocked 
                             ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                             : ticketCount > 0 
                               ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/20' 
                               : 'bg-white/20 text-white/50 cursor-not-allowed'
                         }`}
                       >
                          {isLocked ? <Lock size={14}/> : <Ticket size={14} />}
                          {isLocked ? "LOCKED" : ticketCount > 0 ? "GO (-1)" : "NO TICKET"}
                       </button>
                   </div>
                </div>
             </motion.div>
           );
        })}
      </div>
    </div>
  );
}