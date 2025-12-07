import useSound from 'use-sound';

export const useGameSound = () => {
  // 1. BGM: Dùng html5: true để stream file lớn tốt hơn, tránh lag
  const [playBgm, { stop: stopBgm, sound: bgmSound }] = useSound('/sounds/bg.mp3', { 
    loop: true, 
    volume: 0.4, 
    html5: true,
    interrupt: true
  });

  // 2. POP: Tiếng nổ (Giữ nguyên)
  const [playPop] = useSound('/sounds/pop.mp3', { volume: 0.6 });
  
  // 3. DROP: Tiếng rơi (Tăng volume lên vì thường tiếng này rất trầm)
  const [playDrop] = useSound('/sounds/drop.mp3', { volume: 1.0 }); // Max volume
  
  // 4. EAT: Tiếng ăn
  const [playEat] = useSound('/sounds/eat.mp3', { volume: 0.8, interrupt: true });
  
  // 5. PURR: Tiếng sướng (Tăng volume)
  const [playPurr] = useSound('/sounds/purr.mp3', { volume: 1.0, interrupt: true });
  
  // 6. SUCCESS: Tiếng tiền về
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.6, interrupt: true });
  
  // 7. UI: Tiếng click
  const [playUi] = useSound('/sounds/ui.mp3', { volume: 0.5 });

  const playPopRandom = () => {
    playPop({ playbackRate: 0.9 + Math.random() * 0.2 }); 
  };

  return {
    playBgm, stopBgm, bgmSound,
    playPop: playPopRandom,
    playDrop,
    playEat,
    playPurr,
    playSuccess,
    playUi
  };
};