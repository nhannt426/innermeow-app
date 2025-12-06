'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client'; // Import client vừa tạo

interface UserData {
  id: number;
  first_name: string;
  username?: string;
}

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('Waiting...');

  useEffect(() => {
    const initWebApp = async () => {
      if (typeof window !== 'undefined') {
        try {
          const WebApp = (await import('@twa-dev/sdk')).default;
          WebApp.ready();
          WebApp.expand();

          const user = WebApp.initDataUnsafe.user;
          if (user) {
            setUserData(user as UserData);
            saveUserToDB(user); // Gọi hàm lưu user
          }
        } catch (e) {
          console.log("Error loading SDK");
        }
      }
    };
    initWebApp();
  }, []);

  // Hàm lưu user vào Supabase
  const saveUserToDB = async (user: any) => {
    setDbStatus('Syncing to Database...');
    
    // 1. Kiểm tra user đã tồn tại chưa
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single();

    if (!existingUser) {
      // 2. Nếu chưa, tạo mới
      const { error } = await supabase
        .from('users')
        .insert([
          {
            telegram_id: user.id,
            first_name: user.first_name,
            username: user.username,
            coins: 100, // Thưởng tân thủ
          },
        ]);
      
      if (error) setDbStatus(`Error: ${error.message}`);
      else setDbStatus('✅ New User Created!');
    } else {
      setDbStatus(`✅ Welcome back, Coin: ${existingUser.coins}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-4xl font-light tracking-widest uppercase text-purple-300">Inner Meow</h1>
        
        <div className="p-6 border border-slate-700 rounded-2xl bg-slate-800/50 backdrop-blur-md shadow-xl">
          {userData ? (
            <div className="space-y-4">
              <p className="text-xl">Hello, <span className="font-bold">{userData.first_name}</span></p>
              
              {/* Hiển thị trạng thái Database */}
              <div className="bg-black/30 p-3 rounded-lg">
                <p className="text-xs text-slate-400 uppercase">Database Status</p>
                <p className="text-green-400 font-mono text-sm">{dbStatus}</p>
              </div>
            </div>
          ) : (
            <p className="text-amber-400">Please open in Telegram</p>
          )}
        </div>
      </div>
    </div>
  );
}