import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // UniverCert brand
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          soft: '#EEF0FF',
        },
        accent: {
          DEFAULT: '#EC4899',
          soft: '#FCE7F3',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        gold: '#FBBF24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
} satisfies Config;
