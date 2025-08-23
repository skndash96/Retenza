/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#1e293b',

        card: '#ffffff',
        'card-foreground': '#1e293b',

        primary: {
          DEFAULT: '#4f46e5',
          foreground: '#ffffff',
          hover: '#3730a3',
        },

        secondary: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
          hover: '#5b21b6',
        },

        accent: '#eef2ff',
        destructive: '#dc2626',

        retenza: {
          primary: '#4f46e5',
          'primary-dark': '#3730a3',
          secondary: '#7c3aed',
          'secondary-dark': '#5b21b6',
          accent: '#6366f1',
          'accent-light': '#a5b4fc',
          'accent-bg': '#eef2ff',
          'accent-border': '#c7d2fe',
        }
      },
    },
  },
  plugins: [],
};
