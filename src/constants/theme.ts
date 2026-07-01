/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

const lightPalette = {
  text: '#1b1c1c',
  background: '#ffffff', // Pure white background
  backgroundElement: '#ffffff',
  backgroundSelected: '#f2f0f0',
  textSecondary: '#424750',
  primary: '#114783', // Deep Azure
  secondary: '#2c694e', // Sage Leaf
  tertiary: '#7e3900', // Warm Ochre
  error: '#ba1a1a',
  outline: '#737781',
  surfaceContainer: '#efeded',
} as const;

export const Colors = {
  light: lightPalette,
  dark: lightPalette,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'AtkinsonHyperlegibleNext-Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'AtkinsonHyperlegibleNext-Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'AtkinsonHyperlegibleNext-Regular',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  displayLg: { fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 40, lineHeight: 52 },
  headlineLg: { fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32, lineHeight: 40 },
  headlineMd: { fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 24, lineHeight: 32 },
  bodyLg: { fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 20, lineHeight: 32 },
  bodyMd: { fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 18, lineHeight: 28 },
  labelLg: { fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 18, lineHeight: 24 }, // changed from 600 weight to regular to simplify for now unless we load multiple weights
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16, // gutter
  four: 24, // margin
  five: 32,
  six: 64,
  touchTarget: 56, // min touch target
  stackSm: 12,
  stackMd: 24,
  stackLg: 40,
} as const;

export const Rounded = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  }
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
