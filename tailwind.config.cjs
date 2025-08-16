// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     './src/app/**/*.{ts,tsx,js,jsx}',
//     './src/components/**/*.{ts,tsx,js,jsx}',
//   ],
//   theme: {
//     extend: {
//       colors: {
//         background: 'var(--background)',
//         foreground: 'var(--foreground)',
//         card: 'var(--card)',
//         primary: 'var(--primary)',
//         secondary: 'var(--secondary)',
//         accent: 'var(--accent)',
//         muted: 'var(--muted)',
//         destructive: 'var(--destructive)',
//       },
//     },
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff', // white background
        foreground: '#1e293b', // slate-800 text

        // Cards
        card: '#ffffff', // white card background
        'card-foreground': '#1e293b',

        // Primary (Amber)
        primary: {
          DEFAULT: '#d97706', // amber-600
          foreground: '#ffffff', // white text
          hover: '#b45309', // amber-700
        },

        // Secondary (light amber accent)
        secondary: {
          DEFAULT: '#fef3c7', // amber-100
          foreground: '#78350f', // amber-900 text
        },

        accent: '#fef3c7', // subtle amber tint for highlights
        muted: '#f3f4f6', // slate-100
        destructive: '#dc2626', // red-600
      },
    },
  },
  plugins: [],
};
