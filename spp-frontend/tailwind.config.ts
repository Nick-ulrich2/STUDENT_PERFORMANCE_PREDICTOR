import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./sections/**/*.{ts,tsx}'], theme: { extend: { colors: { ink:'#12212b', navy:'#123d59', sky:'#dff0f4', mint:'#d7eee4', cream:'#f8f8f3', line:'#d7e1df', amber:'#b45309', risk:'#b91c1c' }, fontFamily: { sans:['var(--font-manrope)','sans-serif'], display:['var(--font-dm-serif)','serif'] } } }, plugins: [] };
export default config;
