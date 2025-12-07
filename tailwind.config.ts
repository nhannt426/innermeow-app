import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- BỘ MÀU DESIGN SYSTEM ---
        game: {
          bg: "#1a1b26",       // Nền tối (Deep Night) - Dùng làm nền chính
          primary: "#a78bfa",  // Tím mộng mơ - Dùng cho các điểm nhấn nhẹ
          accent: "#2dd4bf",   // Xanh Mint - Dùng cho Năng lượng & Soul Shards (Nổi bật)
          ui: "rgba(255, 255, 255, 0.1)", // Kính mờ - Dùng cho thanh Menu/Header
          text: "#f1f5f9",     // Chữ sáng trắng ngà - Dễ đọc
        }
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
};
export default config;