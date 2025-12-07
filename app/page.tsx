'use client';

import { useState, useEffect } from 'react';
import ShopModal from '@/components/game/ShopModal';
import { createClient } from '@/utils/supabase/client'; // Assuming you have a client helper

// Mock Telegram WebApp object for development in a browser
const getWebApp = () => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  // Mock for non-Telegram environment
  return {
    HapticFeedback: {
      notificationOccurred: (type: 'success' | 'error' | 'warning') => console.log(`Haptic: ${type}`),
    },
    initDataUnsafe: {
      user: { id: 12345, first_name: 'DevUser' } // Mock user
    }
  };
};

interface UserData {
  id: string;
  coins: number;
  click_level: number;
  energy_level: number;
}

export default function GamePage() {
  const [isShopOpen, setShopOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const supabase = createClient();
  const webApp = getWebApp();

  // Fetch initial user data
  useEffect(() => {
    const fetchUser = async () => {
      // In a real app, you'd get the user ID from Telegram auth
      const userId = webApp.initDataUnsafe.user.id;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) setUserData(data);
      else console.error('Error fetching user:', error);
    };

    fetchUser();
  }, []);

  const handleUpgrade = async (type: 'click' | 'energy') => {
    if (!userData) return;

    const { data, error } = await supabase.rpc('buy_upgrade', {
      p_user_id: userData.id,
      p_type: type,
    });

    if (error) {
      console.error('RPC Error:', error.message);
      webApp.HapticFeedback.notificationOccurred('error');
      return;
    }

    if (data.success) {
      webApp.HapticFeedback.notificationOccurred('success');
      // Update state with the new data from the backend
      setUserData(prev => prev ? {
        ...prev,
        coins: data.coins_left,
        [`${type}_level`]: data.new_level,
      } : null);
    } else {
      console.log('Upgrade failed (not enough coins or max level).');
      webApp.HapticFeedback.notificationOccurred('error');
    }
  };

  if (!userData) {
    return <div>Loading...</div>; // Or a proper loading skeleton
  }

  return (
    <main className="bg-game-bg min-h-screen text-white">
      {/* Your main game UI would go here */}
      <div className="p-4">
        <h1 className="text-3xl font-bold">Inner Meow</h1>
        <p>Coins: {userData.coins}</p>
        <p>Click Level: {userData.click_level}</p>
        <p>Energy Level: {userData.energy_level}</p>
        <button onClick={() => setShopOpen(true)} className="mt-4 px-4 py-2 bg-game-accent rounded-lg">
          Open Shop
        </button>
      </div>

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setShopOpen(false)}
        userCoins={userData.coins}
        clickLevel={userData.click_level}
        energyLevel={userData.energy_level}
        onUpgrade={handleUpgrade}
      />
    </main>
  );
}