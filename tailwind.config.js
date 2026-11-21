import plugin from 'tailwindcss/plugin';

/**
 * "Warm Editorial" design tokens for Lớp Nhân Sinh (v5).
 *
 * Every color scale used across the app is mapped to CSS variables, so the whole UI
 * (including legacy utility classes such as `bg-slate-50`, `text-emerald-700`,
 * `border-amber-200`) switches between Light / Dark mode automatically via the
 * `.dark` class on <html>. Values are stored as "R G B" channels so Tailwind
 * opacity modifiers (`bg-emerald-50/70`) keep working.
 */

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const PALETTES = {
  // Neutral scale -> warm stone in light mode, soft graphite in dark mode
  slate: {
    light: ['#FAFAF9', '#F5F5F4', '#E7E5E4', '#D6D3D1', '#A8A29E', '#78716C', '#57534E', '#44403C', '#292524', '#1C1917', '#0C0A09'],
    dark: ['#1F2025', '#25272D', '#2A2C32', '#3A3D45', '#6B7280', '#8E95A2', '#9CA3AF', '#C4C8CF', '#E0E2E6', '#F3F4F6', '#FAFAFA'],
  },
  // Primary accent -> deep forest green (#1E5631)
  emerald: {
    light: ['#F0F6F1', '#DCEBDF', '#BCD9C3', '#8FBF9C', '#5C9C6D', '#3B7F4E', '#1E5631', '#18472A', '#133A22', '#0F2E1B', '#081B10'],
    dark: ['#17241C', '#1B2E22', '#24412F', '#2F5A3F', '#4E8A63', '#3F7D55', '#2F6B45', '#8CC9A0', '#A9D8B8', '#C7E6D1', '#E3F3E8'],
  },
  // Secondary green -> deep emerald (#0F766E)
  teal: {
    light: ['#F0FAF8', '#D5F1EC', '#A9E2D8', '#6FCBBE', '#36AFA0', '#14958A', '#0F766E', '#0E5F59', '#104D49', '#11403D', '#042F2E'],
    dark: ['#142422', '#172C2A', '#1F403C', '#2A5A54', '#3F9488', '#2F8478', '#237066', '#86CFC4', '#A7DDD4', '#C8EBE5', '#E4F5F2'],
  },
  // Warm amber accent (#D97706)
  amber: {
    light: ['#FFFAF0', '#FEF0D4', '#FDDFA5', '#FBC96B', '#F5AE3A', '#EA9414', '#D97706', '#B45309', '#92400E', '#78350F', '#451A03'],
    dark: ['#2A2114', '#33281A', '#4A3A1F', '#6B5225', '#C08A2E', '#A8721D', '#9A6718', '#E8B45C', '#F0C77E', '#F5D9A3', '#FAEBCB'],
  },
  sky: {
    light: ['#F2F8FC', '#E1EFF8', '#C2DEF0', '#93C5E4', '#5EA6D3', '#3A8BC0', '#2A72A3', '#225C85', '#1E4C6D', '#1C405B', '#12293C'],
    dark: ['#15212B', '#182836', '#1F3A4F', '#2A5470', '#4B8DB8', '#3A7BA5', '#2F6B92', '#8EC3E6', '#AFD4EE', '#CFE5F5', '#E7F2FA'],
  },
  rose: {
    light: ['#FDF3F4', '#FBE4E7', '#F6C9CF', '#EDA1AC', '#E0707F', '#CE4A5C', '#B53649', '#962B3C', '#7C2534', '#68222F', '#3D0F18'],
    dark: ['#2A171B', '#331B20', '#4A242C', '#6B303B', '#C2566A', '#A84458', '#99394D', '#F0A3B1', '#F5BDC7', '#F9D5DC', '#FCEAEE'],
  },
  orange: {
    light: ['#FEF6EF', '#FCE8D6', '#F8CFA9', '#F2AE73', '#EA8A42', '#DD6E22', '#C25717', '#A14415', '#823818', '#6A3017', '#3A160A'],
    dark: ['#2A1C14', '#332218', '#4A301F', '#6B4327', '#C77538', '#B0602A', '#A05524', '#F2B183', '#F6C7A4', '#F9DCC6', '#FCEEE3'],
  },
  indigo: {
    light: ['#F3F4FB', '#E4E6F7', '#C9CDEE', '#A3A9E0', '#7A80CE', '#5F64BA', '#4B4FA3', '#3E4185', '#34376C', '#2E3059', '#1C1D36'],
    dark: ['#1B1C2E', '#202238', '#2C2F52', '#3B4070', '#6E74C7', '#5A60B0', '#4E54A0', '#AEB3F0', '#C5C9F5', '#DCDEF9', '#EDEEFC'],
  },
};

// Semantic surfaces
const SEMANTIC = {
  canvas: { light: '#FAF9F6', dark: '#121316' }, // app background (warm paper / soft night)
  surface: { light: '#FFFFFF', dark: '#1B1C20' }, // cards, sheets, inputs
  ink: { light: '#44403C', dark: '#4B505C' }, // solid neutral for "off" states (white text on top)
};

function hexToChannels(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function buildColorTokens() {
  const colors = {};
  for (const name of Object.keys(PALETTES)) {
    colors[name] = {};
    for (const shade of SHADES) {
      colors[name][shade] = `rgb(var(--c-${name}-${shade}) / <alpha-value>)`;
    }
  }
  for (const name of Object.keys(SEMANTIC)) {
    colors[name] = `rgb(var(--c-${name}) / <alpha-value>)`;
  }
  return colors;
}

function buildCssVariables(mode) {
  const vars = {};
  for (const [name, palette] of Object.entries(PALETTES)) {
    palette[mode].forEach((hex, index) => {
      vars[`--c-${name}-${SHADES[index]}`] = hexToChannels(hex);
    });
  }
  for (const [name, values] of Object.entries(SEMANTIC)) {
    vars[`--c-${name}`] = hexToChannels(values[mode]);
  }
  return vars;
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: buildColorTokens(),
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // Flat, border-first surfaces (Notion / Linear style)
      boxShadow: {
        soft: '0 0 #0000',
        elevated: '0 24px 48px -16px rgb(12 10 9 / 0.22), 0 0 0 1px rgb(12 10 9 / 0.04)',
      },
      // Calmer, less "bubbly" corner radii
      borderRadius: {
        lg: '0.5rem',
        xl: '0.625rem',
        '2xl': '0.875rem',
        '3xl': '1rem',
      },
      // Softer weight hierarchy for long Vietnamese text
      fontWeight: {
        bold: '600',
        extrabold: '700',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': buildCssVariables('light'),
        '.dark': buildCssVariables('dark'),
      });
    }),
  ],
};
