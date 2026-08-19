/** Design tokens mirrored from the Figma source (src/index.css @theme). */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#004ac6',
          hover: '#003a9e',
          fg: '#ffffff',
          soft: '#eff6ff',
        },
        canvas: '#f7f9fb',
        surface: '#ffffff',
        line: {
          DEFAULT: '#c3c6d7',
          light: '#e8eaf2',
          subtle: '#f3f4f8',
        },
        ink: {
          DEFAULT: '#191c1e',
          secondary: '#434655',
          muted: '#505f76',
          placeholder: '#9aa5b8',
        },
        success: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#15803d',
        },
        danger: {
          DEFAULT: '#dc2626',
          bg: '#fef2f2',
          border: '#fecaca',
        },
        warning: {
          DEFAULT: '#d97706',
          bg: '#fffbeb',
        },
        pending: {
          bg: '#f1f5f9',
          text: '#475569',
        },
        processing: {
          bg: '#eff6ff',
          text: '#1d4ed8',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
