// AgroTrade Brand Palette — Green Theme
// Primary: Branded forest green (ecosystem color)
// Accents: Complementary green shades for hierarchy
// Neutral: Pure black, white, gray for text and backgrounds
export const B = {
  bg: "#0C0904",                              // Deep dark soil
  bg2: "#110D07",                             // Alternate warm dark
  card: "#160F08",                            // Card background
  // GREEN PRIMARY BRAND COLOR — All accent elements use this
  green: "#3D7A50",                           // Forest green — PRIMARY brand color
  greenLight: "#10b981",                      // Medium green — secondary accent
  greenBright: "#34d399",                     // Bright emerald — hover states
  greenExtra: "#6ee7b7",                      // Light green — subtle accents
  // Legacy (for backwards compatibility, now deprecated)
  wheat: "#3D7A50",                           // Remapped to green (DO NOT USE DIRECTLY)
  amber: "#10b981",                           // Remapped to green light (DO NOT USE DIRECTLY)
  // Text & borders
  cream: "#F0E5CC",                           // Warm cream — primary text
  muted: "#8B7B68",                           // Warm muted earth
  border: "rgba(61, 122, 80, 0.12)",          // Subtle green border
  borderStrong: "rgba(61, 122, 80, 0.28)",    // Stronger green border
  danger: "#C4654A",                          // Terracotta — danger/error
  // Glassmorphism helpers (green-based)
  glass: "rgba(61, 122, 80, 0.045)",
  glassBorder: "rgba(61, 122, 80, 0.14)",
  glassShadow: "0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(61,122,80,0.07)",
  glassHover: "rgba(61, 122, 80, 0.07)",
} as const;
