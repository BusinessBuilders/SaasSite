/* eslint-disable ts/no-require-imports */
import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bb: {
          'black': 'var(--bb-black)',
          'black-soft': 'var(--bb-black-soft)',
          'black-warm': 'var(--bb-black-warm)',
          'umber': 'var(--bb-umber)',
          'cream': 'var(--bb-cream)',
          'cream-bright': 'var(--bb-cream-bright)',
          'taupe': 'var(--bb-taupe)',
          'dust': 'var(--bb-dust)',
          'orange': 'var(--bb-orange)',
          'orange-deep': 'var(--bb-orange-deep)',
          'orange-soft': 'var(--bb-orange-soft)',
          'teal': 'var(--bb-teal)',
          'teal-soft': 'var(--bb-teal-soft)',
          'brick': 'var(--bb-brick)',
          'gold': 'var(--bb-gold)',
        },
        brand: {
          'gold': 'hsl(38 72% 78%)',
          'gold-light': 'hsl(38 60% 88%)',
          'gold-dark': 'hsl(38 72% 68%)',
          'orange': 'hsl(18 67% 50%)',
          'orange-hover': 'hsl(18 67% 44%)',
          'rust': 'hsl(16 62% 48%)',
          'teal': 'hsl(196 57% 39%)',
          'teal-light': 'hsl(196 50% 50%)',
          'cream': 'hsl(38 75% 97%)',
          'dark': 'hsl(0 0% 4%)',
          'muted': 'hsl(30 14% 42%)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        'bb-display': ['var(--bb-font-display)'],
        'bb-display-2': ['var(--bb-font-display-2)'],
        'bb-body': ['var(--bb-font-body)'],
      },
      boxShadow: {
        'bb-letter': 'var(--bb-shadow-letter)',
        'bb-card': 'var(--bb-shadow-card)',
        'bb-featured': 'var(--bb-shadow-featured)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
