import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'] as unknown as 'media' | 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			border: 'var(--border-primary)',
  			input: 'var(--border-primary)',
  			ring: 'var(--accent-primary)',
  			primary: {
  				DEFAULT: 'var(--accent-primary)',
  				foreground: 'var(--text-inverse)'
  			},
  			secondary: {
  				DEFAULT: 'var(--bg-secondary)',
  				foreground: 'var(--text-secondary)'
  			},
  			muted: {
  				DEFAULT: 'var(--bg-secondary)',
  				foreground: 'var(--text-muted)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent-secondary)',
  				foreground: 'var(--accent-primary)'
  			},
  			destructive: {
  				DEFAULT: 'var(--status-error-text)',
  				foreground: 'var(--text-inverse)'
  			},
  			card: {
  				DEFAULT: 'var(--bg-card)',
  				foreground: 'var(--text-primary)'
  			},
  			popover: {
  				DEFAULT: 'var(--bg-card)',
  				foreground: 'var(--text-primary)'
  			},
  			'color-0': 'var(--color-0)',
  			'color-1': 'var(--color-1)',
  			'color-2': 'var(--color-2)',
  			'color-3': 'var(--color-3)',
  			'color-4': 'var(--color-4)',
  			'color-5': 'var(--color-5)',
  			'color-black': 'var(--color-black)',
  			'color-white': 'var(--color-white)',
  			'bg-primary': 'var(--bg-primary)',
  			'bg-secondary': 'var(--bg-secondary)',
  			'bg-card': 'var(--bg-card)',
  			'bg-hover': 'var(--bg-hover)',
  			'bg-canvas': 'var(--bg-canvas)',
  			'text-primary': 'var(--text-primary)',
  			'text-secondary': 'var(--text-secondary)',
  			'text-muted': 'var(--text-muted)',
  			'text-inverse': 'var(--text-inverse)',
  			'border-primary': 'var(--border-primary)',
  			'border-secondary': 'var(--border-secondary)',
  			'border-subtle': 'var(--border-subtle)',
  			'accent-primary': 'var(--accent-primary)',
  			'accent-secondary': 'var(--accent-secondary)',
  			'accent-hover': 'var(--accent-hover)',
  			'status-success': {
  				bg: 'var(--status-success-bg)',
  				text: 'var(--status-success-text)',
  				border: 'var(--status-success-border)'
  			},
  			'status-error': {
  				bg: 'var(--status-error-bg)',
  				text: 'var(--status-error-text)',
  				border: 'var(--status-error-border)'
  			},
  			'status-warning': {
  				bg: 'var(--status-warning-bg)',
  				text: 'var(--status-warning-text)',
  				border: 'var(--status-warning-border)'
  			},
  			'status-info': {
  				bg: 'var(--status-info-bg)',
  				text: 'var(--status-info-text)',
  				border: 'var(--status-info-border)'
  			},
  			'button-primary': {
  				bg: 'var(--button-primary-bg)',
  				hover: 'var(--button-primary-hover)',
  				text: 'var(--button-primary-text)'
  			},
  			'button-secondary': {
  				bg: 'var(--button-secondary-bg)',
  				hover: 'var(--button-secondary-hover)',
  				text: 'var(--button-secondary-text)',
  				border: 'var(--button-secondary-border)'
  			},
  			'toggle-active-bg': 'var(--toggle-active-bg)',
  			'toggle-active-text': 'var(--toggle-active-text)',
  			'toggle-active-border': 'var(--toggle-active-border)',
  			'quota-ok-bg': 'var(--quota-ok-bg)',
  			'quota-ok-text': 'var(--quota-ok-text)',
  			'quota-ok-border': 'var(--quota-ok-border)',
  			'quota-warning-bg': 'var(--quota-warning-bg)',
  			'quota-warning-text': 'var(--quota-warning-text)',
  			'quota-warning-border': 'var(--quota-warning-border)',
  			'quota-critical-bg': 'var(--quota-critical-bg)',
  			'quota-critical-text': 'var(--quota-critical-text)',
  			'quota-critical-border': 'var(--quota-critical-border)',
  			'graph-1': 'var(--graph-1)',
  			'graph-2': 'var(--graph-2)',
  			'graph-3': 'var(--graph-3)',
  			'graph-4': 'var(--graph-4)',
  			'graph-5': 'var(--graph-5)',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		boxShadow: {
  			'theme-sm': 'var(--shadow-sm)',
  			'theme-md': 'var(--shadow-md)',
  			'theme-lg': 'var(--shadow-lg)',
  			'focus-ring': 'var(--focus-ring)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};
export default config;
