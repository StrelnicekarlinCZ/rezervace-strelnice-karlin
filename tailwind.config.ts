import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tactical: {
          950: '#070907',
          900: '#0d120f',
          800: '#151d18',
          700: '#223027',
          green: '#8cc63f'
        }
      }
    }
  },
  plugins: []
};
export default config;
