import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cinematic, AI-first dark palette — calm, spatial, premium.
        ink: '#07080d', // deepest background
        surface: '#0d0f17', // panel base
        glass: 'rgba(255,255,255,0.04)',
        hairline: 'rgba(255,255,255,0.08)',
        glow: '#6ea8fe', // ambient accent (cool)
        ember: '#f0a868', // warm accent for handoffs
        sage: '#7fd1b9',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        cinematic: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        glow: '0 0 40px -8px rgba(110,168,254,0.45)',
      },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
