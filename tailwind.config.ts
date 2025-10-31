import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          fg: 'var(--card-fg)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          fg: 'var(--muted-fg)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          fg: 'var(--primary-fg)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          fg: 'var(--secondary-fg)'
        },
        danger: {
          DEFAULT: 'var(--danger)',
          fg: 'var(--danger-fg)'
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)'
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.05)'
      }
    }
  },
  plugins: []
} satisfies Config;


