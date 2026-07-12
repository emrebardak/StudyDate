export const Colors = {
  // Backgrounds
  background: '#F5EFE6',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF5EE',
  cardBg: '#FDF8F2',

  // Brand / Primary
  primary: '#7B3F2E',       // deep maroon
  primaryLight: '#A0522D',
  primaryMuted: '#C49A7A',

  // Accent
  accent: '#D4A843',        // golden amber
  accentLight: '#F2DFA0',
  accentBg: '#FFF8E1',

  // Text
  textPrimary: '#2C1A0E',
  textSecondary: '#6B4C3B',
  textMuted: '#9E8070',
  textLight: '#C4A882',

  // Chat
  chatReceived: '#FFFFFF',
  chatSent: '#7B3F2E',
  chatSentText: '#FFFFFF',

  // Utility
  border: '#E8D8C8',
  borderLight: '#F0E4D4',
  danger: '#C0392B',
  success: '#5D8A5E',
  white: '#FFFFFF',
  black: '#000000',

  // Tab bar
  tabActive: '#7B3F2E',
  tabInactive: '#9E8070',
  tabBg: '#FFFFFF',

  // Badge chips
  badgeBg: '#FDF0E0',
  badgeBorder: '#E8C99A',
};

export const Typography = {
  fontTitle: undefined,      // system serif fallback
  fontBody: undefined,

  size: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
