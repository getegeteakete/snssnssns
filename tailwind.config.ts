import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:     '#04040a',
        s1:     '#0a0a14',
        s2:     '#0f0f1e',
        b1:     '#1a1a2e',
        b2:     '#252540',
        txt:    '#e8e8f4',
        muted:  '#6b6b8a',
        cyan:   '#00d4ff',
        amber:  '#ffb800',
        green:  '#00e5a0',
        purple: '#8b5cf6',
        red:    '#ff4560',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
