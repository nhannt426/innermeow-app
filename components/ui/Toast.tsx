'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

export default function Toast({ message, isVisible, onClose, type = 'success' }: ToastProps) {
  // Tự động đóng sau 2 giây
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 20, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none"
        >
          <div className={`
            flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10
            ${type === 'success' ? 'bg-black/80 text-white' : 'bg-red-900/90 text-white'}
          `}>
            {type === 'success' ? (
              <CheckCircle className="text-green-400 w-5 h-5" />
            ) : (
              <XCircle className="text-red-400 w-5 h-5" />
            )}
            
            <span className="font-bold text-sm tracking-wide">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}