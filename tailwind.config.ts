import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // You can extend your theme here if needed in the future
    },
  },
  plugins: [],
};

export default config;
