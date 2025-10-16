import type { Config } from "tailwindcss";

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: 'var(--font-sans)',
  			serif: 'var(--font-serif)'
  		},
  		colors: {
        // Semantic tokens - NO hsl() wrapper, vars already contain hex values
  			bg: 'var(--bg)',
  			fg: 'var(--text)',
  			text: 'var(--text)',
  			muted: 'var(--muted)',
  			surface: 'var(--surface)',
  			subtle: 'var(--subtle)',
  			border: 'var(--border)',
  			cta: 'var(--cta)',
  			accent: 'var(--accent)',
        
        // Jade palette
        jade: {
          900: 'var(--jade-900)',
          800: 'var(--jade-800)',
          700: 'var(--jade-700)',
          600: 'var(--jade-600)',
          500: 'var(--jade-500)'
        },
        
        // Gold palette
        gold: {
          600: 'var(--gold-600)',
          500: 'var(--gold-500)',
          400: 'var(--gold-400)'
        },
        
        // Shadcn compatibility - NO hsl() wrapper
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			sidebar: {
  				DEFAULT: 'var(--sidebar-background)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			}
  		},
  		borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
  			lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)'
  		},
  		boxShadow: {
  			soft: 'var(--sh-1)',
        elev1: 'var(--sh-1)',
        elev2: 'var(--sh-2)',
  			medium: '0 8px 24px rgba(0,0,0,.12)',
  			strong: '0 12px 40px rgba(0,0,0,.18)'
  		},
      maxWidth: {
        container: 'var(--container)'
      },
      spacing: {
        mobile: 'var(--mobile)'
      },
  		transitionDuration: {
  			smooth: '300ms'
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
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
