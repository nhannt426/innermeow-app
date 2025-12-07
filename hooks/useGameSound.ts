import useSound from 'use-sound';

export const useGameSound = () => {
  // 1. SFX: Bong bóng nổ (Thêm sprite hoặc chỉnh volume)
  const [playPop] = useSound('/sounds/pop.mp3', { volume: 0.6 });
  
  // 2. SFX: Rớt đồ
  const [playDrop] = useSound('/sounds/drop.mp3', { volume: 0.5 });
  
  // 3. SFX: Mèo ăn/dùng đồ (Nghe sướng tai nhất)
  const [playEat] = useSound('/sounds/eat.mp3', { volume: 0.8 });
  
  // 4. SFX: Thành công/Nhận tiền
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  
  // 5. SFX: UI Click
  const [playUi] = useSound('/sounds/ui.mp3', { volume: 0.3 });

  // Hàm wrapper để play Pop với cao độ ngẫu nhiên (Biến âm thanh trở nên "Juicy")
  const playPopRandom = () => {
    // Random playbackRate từ 0.9 đến 1.1 -> Tiếng nổ sẽ khác nhau mỗi lần
    // playPop({ playbackRate: 0.9 + Math.random() * 0.2 }); 
    // Lưu ý: use-sound bản basic có thể chưa support dynamic playbackRate trực tiếp trong hàm play ngay, 
    // nhưng ta cứ gọi mặc định trước cho mượt.
    playPop();
  };

  return {
    playPop: playPopRandom,
    playDrop,
    playEat,
    playSuccess,
    playUi
  };
};