import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // UniverCert · paleta oficial: navy + gold
        primary: {
          DEFAULT: '#1B2D5E', // navy escuro
          50: '#EEF1F8',
          100: '#D5DCED',
          200: '#A9B7DA',
          300: '#7E92C7',
          400: '#526EB4',
          500: '#1B2D5E',
          600: '#15244A',
          700: '#0F1B37',
          800: '#0A1224',
          900: '#050912',
          dark: '#0F1B3E',
          soft: '#EEF1F8',
        },
        accent: {
          DEFAULT: '#D4A937', // gold
          50: '#FAF4E0',
          100: '#F5E9C2',
          200: '#EBD485',
          300: '#E1BE48',
          400: '#D4A937',
          500: '#B8911F',
          600: '#9C7A1A',
          700: '#806314',
          dark: '#9C7A1A',
          soft: '#FAF4E0',
        },
        gold: { DEFAULT: '#D4A937', light: '#E8BF4F', soft: '#FAF4E0' },
        navy: { DEFAULT: '#1B2D5E', dark: '#0F1B3E' },
        success: { DEFAULT: '#10B981', soft: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', soft: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', soft: '#FEE2E2' },
        ink: {
          900: '#0A0E1A',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '28px', '3xl': '36px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.03)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.04)',
        'card-lift': '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',
        'glow-primary': '0 8px 32px -8px rgba(27,45,94,0.45)',
        'glow-gold': '0 8px 32px -8px rgba(212,169,55,0.50)',
        'glow-success': '0 8px 32px -8px rgba(16,185,129,0.45)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1B2D5E 0%, #2A4080 50%, #D4A937 100%)',
        'gradient-shield': 'linear-gradient(135deg, #1B2D5E 0%, #0F1B3E 100%)',
        'gradient-gold': 'linear-gradient(135deg, #E8BF4F 0%, #D4A937 50%, #B8911F 100%)',
        'gradient-mesh': "radial-gradient(at 20% 30%, rgba(27,45,94,0.18) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(212,169,55,0.15) 0px, transparent 50%)",
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,169,55,0.45)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,169,55,0)' },
        },
        'float': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      letterSpacing: {
        'tightest': '-0.04em', 'tighter': '-0.03em', 'tight': '-0.02em',
      },
    },
  },
  plugins: [],
} satisfies Config;
