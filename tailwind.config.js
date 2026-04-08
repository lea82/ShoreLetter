/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shore Letter design tokens
        sand: {
          50:  '#faf8f4',
          100: '#f5f0e8',
          200: '#ede6d6',
          300: '#e3d9c4',
          400: '#d4c8a8',
          500: '#bfaa84',
        },
        water: {
          100: '#e8f2f7',
          200: '#c8dde8',
          300: '#9bbfd4',
          400: '#6a9ab8',
          500: '#4a8fa8',
          600: '#2e6e8a',
        },
        deep: {
          700: '#1a2e3b',
          800: '#132230',
          900: '#0d1820',
        },
        stone: {
          shore: '#7a8a94',
        },
        tide: {
          DEFAULT: '#4a8fa8',
          dark: '#2e6e8a',
        },
        gold: {
          shore: '#b8943f',
          light: '#d4aa55',
        },
      },
      fontFamily: {
        serif: ['var(--font-baskerville)', 'Georgia', 'serif'],
        sans:  ['var(--font-lato)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-dm-mono)', 'monospace'],
        cn:    ['var(--font-noto-serif-sc)', 'serif'],
      },
      animation: {
        'float':        'float 4s ease-in-out infinite',
        'tide':         'tide 8s ease-in-out infinite',
        'fade-up':      'fadeUp 0.6s ease forwards',
        'letter-in':    'letterIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'wave-release': 'waveRelease 0.8s ease forwards',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%':     { transform: 'translateY(-10px) rotate(2deg)' },
        },
        tide: {
          '0%,100%': { transform: 'translateY(0) skewX(-0.5deg)' },
          '50%':     { transform: 'translateY(-8px) skewX(0.5deg)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        letterIn: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        waveRelease: {
          '0%':   { transform: 'scaleX(0)', opacity: '0' },
          '50%':  { opacity: '1' },
          '100%': { transform: 'scaleX(1)', opacity: '0' },
        },
      },
      backgroundImage: {
        'shore-gradient': 'linear-gradient(180deg, #f5f0e8 0%, #c8dde8 100%)',
        'deep-gradient':  'linear-gradient(180deg, #1a2e3b 0%, #0d1820 100%)',
        'water-shimmer':  'linear-gradient(135deg, #c8dde8 0%, #9bbfd4 50%, #c8dde8 100%)',
      },
    },
  },
  plugins: [],
}
