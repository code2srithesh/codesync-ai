/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#09090b", // zinc-950
          800: "#18181b", // zinc-900
          700: "#27272a", // zinc-800
          600: "#3f3f46", // zinc-700
        },
        brand: {
          purple: "#a855f7", // purple-500
          magenta: "#ec4899", // pink-500
          blue: "#3b82f6", // blue-500
          emerald: "#10b981", // emerald-500
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Outfit", "Fira Code", "monospace"],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(236, 72, 153, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
