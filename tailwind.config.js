/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Academic Continuity type scale
        'headline-lg': ['34px', { lineHeight: '41px',  fontWeight: '700', letterSpacing: '-0.025em' }],
        'headline-md': ['22px', { lineHeight: '28px',  fontWeight: '600', letterSpacing: '0.022em'  }],
        'headline-sm': ['17px', { lineHeight: '22px',  fontWeight: '600', letterSpacing: '-0.025em' }],
        'body-lg':     ['17px', { lineHeight: '22px',  fontWeight: '400', letterSpacing: '-0.025em' }],
        'body-md':     ['15px', { lineHeight: '20px',  fontWeight: '400', letterSpacing: '-0.012em' }],
        'label-md':    ['13px', { lineHeight: '18px',  fontWeight: '500', letterSpacing: '-0.005em' }],
        'label-sm':    ['11px', { lineHeight: '13px',  fontWeight: '600', letterSpacing: '0.005em'  }],
      },

      // ── Colors ────────────────────────────────────────────────────────
      colors: {
        // Semantic aliases — all routed through CSS vars (theme-aware)
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',

        primary: {
          DEFAULT:   'hsl(var(--primary))',
          foreground:'hsl(var(--primary-foreground))',
          container: 'hsl(var(--primary-container))',
          fixed:     'hsl(var(--primary-fixed))',
          'fixed-dim':'hsl(var(--primary-fixed-dim))',
        },
        'on-primary': {
          DEFAULT:   'hsl(var(--primary-foreground))',
          container: 'hsl(var(--on-primary-container))',
          fixed:     'hsl(var(--on-primary-fixed))',
          'fixed-variant': 'hsl(var(--on-primary-fixed-variant))',
        },
        'inverse-primary': 'hsl(var(--inverse-primary))',

        secondary: {
          DEFAULT:   'hsl(var(--secondary))',
          foreground:'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--secondary-container))',
          fixed:     'hsl(var(--secondary-fixed))',
          'fixed-dim':'hsl(var(--secondary-fixed-dim))',
        },
        'on-secondary': {
          DEFAULT:   'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--on-secondary-container))',
          fixed:     'hsl(var(--on-secondary-fixed))',
          'fixed-variant': 'hsl(var(--on-secondary-fixed-variant))',
        },

        tertiary: {
          DEFAULT:   'hsl(var(--tertiary))',
          foreground:'hsl(var(--tertiary-foreground))',
          container: 'hsl(var(--tertiary-container))',
        },
        'on-tertiary': {
          DEFAULT:   'hsl(var(--tertiary-foreground))',
          container: 'hsl(var(--on-tertiary-container))',
        },

        // Surface family
        surface: {
          DEFAULT:            'hsl(var(--surface))',
          dim:                'hsl(var(--surface-dim))',
          bright:             'hsl(var(--surface-bright))',
          variant:            'hsl(var(--surface-variant))',
          tint:               'hsl(var(--surface-tint))',
          container:          'hsl(var(--surface-container))',
          'container-low':    'hsl(var(--surface-container-low))',
          'container-lowest': 'hsl(var(--surface-container-lowest))',
          'container-high':   'hsl(var(--surface-container-high))',
          'container-highest':'hsl(var(--surface-container-highest))',
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface))',
          variant: 'hsl(var(--on-surface-variant))',
        },
        'inverse-surface':    'hsl(var(--inverse-surface))',
        'inverse-on-surface': 'hsl(var(--inverse-on-surface))',

        // Outline
        outline: {
          DEFAULT: 'hsl(var(--outline))',
          variant: 'hsl(var(--outline-variant))',
        },

        // Error / destructive
        destructive: {
          DEFAULT:   'hsl(var(--destructive))',
          foreground:'hsl(var(--destructive-foreground))',
          container: 'hsl(var(--error-container))',
          on:        'hsl(var(--on-error-container))',
        },

        // Semantic status
        success: {
          DEFAULT:   'hsl(var(--success))',
          foreground:'hsl(var(--success-foreground))',
          light:     'hsl(var(--success-light))',
        },
        warning: {
          DEFAULT:   'hsl(var(--warning))',
          foreground:'hsl(var(--warning-foreground))',
          light:     'hsl(var(--warning-light))',
        },
        info: {
          DEFAULT:   'hsl(var(--info))',
          foreground:'hsl(var(--info-foreground))',
          light:     'hsl(var(--info-light))',
          container: 'hsl(var(--info-container))',
          on:        'hsl(var(--on-info-container))',
        },

        // Card / popover / muted
        muted: {
          DEFAULT:   'hsl(var(--muted))',
          foreground:'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:   'hsl(var(--primary-fixed))',
          foreground:'hsl(var(--on-primary-fixed))',
        },
        card: {
          DEFAULT:   'hsl(var(--card))',
          foreground:'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:   'hsl(var(--popover))',
          foreground:'hsl(var(--popover-foreground))',
        },

        // Sidebar
        sidebar: {
          DEFAULT:            'hsl(var(--sidebar))',
          foreground:         'hsl(var(--sidebar-foreground))',
          accent:             'hsl(var(--sidebar-accent))',
          'accent-foreground':'hsl(var(--sidebar-accent-foreground))',
        },

        // Convenience aliases used in existing components
        'subtle-foreground': 'hsl(var(--subtle-foreground))',

        // Charts
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ── Border radius — Academic Continuity scale ─────────────────────
      borderRadius: {
        sm:      '4px',   /* 0.25rem */
        DEFAULT: '8px',   /* 0.5rem  */
        md:      '12px',  /* 0.75rem */
        lg:      '16px',  /* 1rem    */
        xl:      '24px',  /* 1.5rem  */
        '2xl':   '24px',
        '3xl':   '24px',
        full:    '9999px',
      },

      // ── Spacing — 8px base ────────────────────────────────────────────
      spacing: {
        'xs':  '4px',
        'sm':  '8px',
        'md':  '16px',
        'lg':  '24px',
        'xl':  '32px',
        'margin-mobile': '16px',
        'gutter-mobile': '16px',
      },

      // ── Shadows — tonal, no heavy drops ──────────────────────────────
      boxShadow: {
        sm:      '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        md:      '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        lg:      '0 8px 24px -4px rgb(0 0 0 / 0.10), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
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
