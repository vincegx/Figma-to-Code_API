import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Base palette colors
        'color-0': 'var(--color-0)',
        'color-1': 'var(--color-1)',
        'color-2': 'var(--color-2)',
        'color-3': 'var(--color-3)',
        'color-4': 'var(--color-4)',
        'color-5': 'var(--color-5)',
        'color-black': 'var(--color-black)',
        'color-white': 'var(--color-white)',

        // Semantic backgrounds
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'bg-hover': 'var(--bg-hover)',
        'bg-canvas': 'var(--bg-canvas)',

        // Semantic text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',

        // Semantic borders
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'border-subtle': 'var(--border-subtle)',

        // Accents
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-hover': 'var(--accent-hover)',

        // Status colors
        'status-success': {
          bg: 'var(--status-success-bg)',
          text: 'var(--status-success-text)',
          border: 'var(--status-success-border)',
        },
        'status-error': {
          bg: 'var(--status-error-bg)',
          text: 'var(--status-error-text)',
          border: 'var(--status-error-border)',
        },
        'status-warning': {
          bg: 'var(--status-warning-bg)',
          text: 'var(--status-warning-text)',
          border: 'var(--status-warning-border)',
        },
        'status-info': {
          bg: 'var(--status-info-bg)',
          text: 'var(--status-info-text)',
          border: 'var(--status-info-border)',
        },

        // Buttons
        'button-primary': {
          bg: 'var(--button-primary-bg)',
          hover: 'var(--button-primary-hover)',
          text: 'var(--button-primary-text)',
        },
        'button-secondary': {
          bg: 'var(--button-secondary-bg)',
          hover: 'var(--button-secondary-hover)',
          text: 'var(--button-secondary-text)',
          border: 'var(--button-secondary-border)',
        },
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'focus-ring': 'var(--focus-ring)',
      },
    },
  },
  plugins: [],
};
export default config;
