/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'explorer-bg': '#0d1117',
        'explorer-surface': '#161b22',
        'explorer-border': '#30363d',
        'explorer-text': '#c9d1d9',
        'explorer-text-dim': '#8b949e',
        'explorer-accent': '#58a6ff',
        'explorer-accent-dim': '#1f6feb',
        'explorer-node': '#238636',
        'explorer-node-selected': '#58a6ff',
        'explorer-edge': '#484f58',
      },
    },
  },
  plugins: [],
};
