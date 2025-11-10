import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			border: 'var(--border)',
  			input: 'var(--input)',
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			'primary-hover': 'var(--primary-hover)',
  			'primary-foreground': 'var(--primary-foreground)',
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			'secondary-hover': 'var(--secondary-hover)',
  			'secondary-foreground': 'var(--secondary-foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			'card-foreground': 'var(--card-foreground)',
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			'muted-foreground': 'var(--muted-foreground)',
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			ring: 'var(--ring)',
  			chart: {
  				'1': 'var(--chart-1)',
  				'2': 'var(--chart-2)',
  				'3': 'var(--chart-3)',
  				'4': 'var(--chart-4)',
  				'5': 'var(--chart-5)'
  			}
  		},
  		boxShadow: {
  			primary: 'var(--shadow-primary)',
  			md: 'var(--shadow-md)',
  			sm: 'var(--shadow-sm)',
  			DEFAULT: 'var(--shadow-default)'
  		},
  		borderRadius: {
  			DEFAULT: 'var(--radius)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			head: [
  				'Archivo Black',
  				'Space Grotesk',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'Space Grotesk',
  				'system-ui',
  				'sans-serif'
  			]
  		},
		spacing: {
			'4.5': '1.125rem'
		},
  	}
  },
  plugins: [tailwindcssAnimate],
}
