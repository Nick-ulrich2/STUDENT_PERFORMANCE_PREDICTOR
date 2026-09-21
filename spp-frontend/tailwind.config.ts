import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#12212b',
        navy: '#123d59',
        sky: '#dff0f4',
        mint: '#d7eee4',
        cream: '#f8f8f3',
        line: '#d7e1df',
        teal: '#2d7770',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-dm-serif)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
