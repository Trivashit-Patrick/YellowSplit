// YellowSplit Design System
export const colors = {
  primary: '#F5C800',
  background: '#111111',
  card: '#1E1E1E',
  surface: '#1A1A1A',
  textPrimary: '#F5F5F5',
  textOnYellow: '#111111',
  textMuted: '#888888',
  textDark: '#7a6000',
  divider: '#2C2C2C',
  error: '#FF4444',
  success: '#F5C800',
  owedGreen: '#2E7D32',
  oweRed: '#FF4444',
  settled: '#888888',
  // Category colors
  categoryFood: '#F5C800',
  categoryTravel: '#FF6B6B',
  categoryRent: '#64B5F6',
  categoryOther: '#CE93D8',
  categoryUtilities: '#4DB6AC',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 22,
  full: 999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  spring: {
    damping: 15,
    stiffness: 150,
  },
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};
