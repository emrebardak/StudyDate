// ── StudyMatch Dark Mode Design System ───────────────────────────────────────
// Palette: Ink Black / Prussian Blue / Regal Navy / School Bus Yellow / Gold

export const Colors = {
  // ── Core backgrounds ──────────────────────────────────────────────────────
  background:   '#0A1420',   // Ink Black  — global app bg
  surface:      '#0F2847',   // Prussian Blue — cards, chat bg
  surfaceHigh:  '#1C4A7E',   // Regal Navy — elevated cards, borders
  surfaceMid:   '#12365F',   // between surface and surfaceHigh

  // ── Brand / CTA ──────────────────────────────────────────────────────────
  primary:      '#ffc300',   // School Bus Yellow — CTAs, active tabs
  primaryAlt:   '#ffd60a',   // Gold — accents, badges, highlights
  primaryDim:   '#b38a00',   // dimmed yellow for pressed states

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#8899AA',  // muted blue-grey
  textMuted:     '#4A6080',  // very muted
  textOnYellow:  '#000814',  // text on yellow buttons

  // ── Borders ──────────────────────────────────────────────────────────────
  border:       '#1C4A7E',   // Regal Navy
  borderLight:  '#0F2847',   // Prussian Blue
  borderGold:   '#ffc300',   // yellow border for active

  // ── Semantic ─────────────────────────────────────────────────────────────
  danger:   '#FF4D4D',
  success:  '#22C55E',
  info:     '#3B82F6',

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabActive:   '#ffc300',
  tabInactive: '#4A6080',
  tabBg:       '#0A1420',
  tabActiveBg: '#ffc300',

  // ── Chat bubbles ──────────────────────────────────────────────────────────
  bubbleReceived:  '#0F2847',  // Prussian Blue
  bubbleSent:      '#1C4A7E',  // Regal Navy
  bubbleSentText:  '#FFFFFF',

  // ── Misc ─────────────────────────────────────────────────────────────────
  white:  '#FFFFFF',
  black:  '#000000',
  overlay: 'rgba(0,8,20,0.7)',
};

export const Typography = {
  size: {
    xs:   10,
    sm:   12,
    md:   14,
    base: 16,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  },
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
};

// No heavy shadows — depth via color contrast
export const Shadow = {
  card: {
    shadowColor: '#000814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#ffc300',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
