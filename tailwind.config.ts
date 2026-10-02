import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#1c1a18',
          tint: '#262320',
          soft: '#211e1c',
        },
        ink: {
          DEFAULT: '#f2efe9',
          strong: '#ffffff',
          soft: '#d8d3cb',
          muted: '#a8a29a',
          faint: '#8f8a82',
        },
        line: {
          DEFAULT: '#2e2b27',
          strong: '#3f3b36',
        },
        accent: {
          DEFAULT: '#d6b88f',
          deep: '#e5cfa7',
          soft: '#2a241d',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"New York"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      maxWidth: {
        content: '67.5rem',
        prose: '44rem',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
