/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
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
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          light: 'hsl(var(--success-light))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          light: 'hsl(var(--warning-light))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          light: 'hsl(var(--info-light))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // ─── SchoolOS "Digital Hearth" Material tokens ───────────────────────
        // Surfaces / text / outline are theme-aware via CSS vars (see index.css
        // :root + .dark). Brand "fixed" tones stay constant across themes by
        // design — they are light chips with dark text and read on dark cards.
        surface: {
          DEFAULT: 'var(--surface)',
          dim: 'var(--surface-dim)',
          bright: 'var(--surface-bright)',
          variant: 'var(--surface-variant)',
          container: 'var(--surface-container)',
          'container-low': 'var(--surface-container-low)',
          'container-lowest': 'var(--surface-container-lowest)',
          'container-high': 'var(--surface-container-high)',
          'container-highest': 'var(--surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },

        // Brand fixed tones — constant across light/dark (MD3 "fixed" role)
        'primary-container': '#1a5c38',
        'primary-fixed': {
          DEFAULT: '#aef2c2',
          dim: '#93d5a7',
        },
        'on-primary-container': '#90d2a5',
        'secondary-container': '#feae2c',
        'secondary-fixed': {
          DEFAULT: '#ffddb4',
          dim: '#ffb955',
        },
        'on-secondary-fixed': {
          DEFAULT: '#291800',
          variant: '#633f00',
        },

        // Semantic container families — flip light↔dark (see index.css)
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
          on: 'var(--on-error-container)',
        },
        tertiary: {
          DEFAULT: 'var(--amber)',
          container: 'var(--amber-container)',
          on: 'var(--on-amber-container)',
        },
        'info-accent': 'var(--info)',
        'info-container': 'var(--info-container)',
        'on-info-container': 'var(--on-info-container)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius)',
        '2xl': 'calc(var(--radius) + 4px)',
        '3xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        md: '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        lg: '0 8px 24px -4px rgb(0 0 0 / 0.10), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
