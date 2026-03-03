// AgroTrade Design Tokens — Bold Fintech Glassmorphism

export const GRADIENT = {
  background: ['#021207', '#000a03', '#000000'] as const,
  green: ['#16A34A', '#4ADE80'] as const,
  gold: ['#D97706', '#FCD34D'] as const,
};

export const GLASS = {
  subtle: {
    fill: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.10)',
    blur: 20,
  },
  medium: {
    fill: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.18)',
    blur: 20,
  },
  strong: {
    fill: 'rgba(255,255,255,0.22)',
    border: 'rgba(255,255,255,0.28)',
    blur: 20,
  },
};

export const COLORS = {
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.35)',
  accentGreen: '#4ADE80',
  accentGold: '#FCD34D',
  danger: '#F87171',
  warning: '#FCD34D',
  success: '#4ADE80',
  info: '#60A5FA',
};

export const ANIM = {
  spring: { damping: 18, stiffness: 200 },
  springBouncy: { damping: 14, stiffness: 180 },
  springStiff: { damping: 22, stiffness: 250 },
  cardStaggerMs: 60,
};
