/**
 * The prototype loads three families from Google Fonts (src/styles/fonts.css):
 *   Barlow Condensed — big numerals (stat values, the run timer)
 *   Inter           — everything conversational
 *   DM Mono         — paces, splits, chart axis labels
 *
 * Names here must match the keys passed to `useFonts` in app/_layout.tsx.
 */
export const fonts = {
  display: {
    regular: 'BarlowCondensed_400Regular',
    semibold: 'BarlowCondensed_600SemiBold',
    bold: 'BarlowCondensed_700Bold',
    extrabold: 'BarlowCondensed_800ExtraBold',
  },
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
  },
  mono: {
    regular: 'DMMono_400Regular',
    medium: 'DMMono_500Medium',
  },
} as const;

/** Tailwind's default type scale, which the prototype uses unmodified. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;
