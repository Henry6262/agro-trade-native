#!/usr/bin/env node

const PptxGenJS = require("pptxgenjs");

// Create presentation
const pres = new PptxGenJS();

// Set slide dimensions (standard 16:9)
pres.defineLayout({
  name: "TITLE",
  width: 10,
  height: 5.625,
});
pres.defineLayout({
  name: "CONTENT",
  width: 10,
  height: 5.625,
});

const darkBg = "#0C0904";
const darkCard = "#160F08";
const green = "#3D7A50";
const greenLight = "#10b981";
const greenBright = "#34d399";
const greenExtra = "#6ee7b7";
const lightText = "#F5F5F5";
const mutedText = "#A0A0A0";

// Helper: Create gradient fill
function createGradient(color1, color2) {
  return {
    type: "solid",
    color: color1,
    transparency: 0,
  };
}

// ===== SLIDE 1: Title Slide =====
const slide1 = pres.addSlide();
slide1.background = { color: darkBg };

// Accent bar
slide1.addShape(pres.ShapeType.rect, {
  x: 0,
  y: 0,
  w: "100%",
  h: 1.2,
  fill: { color: green },
  line: { type: "none" },
});

// Logo/Leaf icon (represented as shape)
slide1.addShape(pres.ShapeType.ellipse, {
  x: 0.5,
  y: 0.25,
  w: 0.7,
  h: 0.7,
  fill: { color: greenBright },
  line: { type: "none" },
});

slide1.addText("AgroTrade", {
  x: 1.4,
  y: 0.3,
  w: 4,
  h: 0.8,
  fontSize: 44,
  fontFace: "Calibri",
  bold: true,
  color: lightText,
  align: "left",
  valign: "middle",
});

// Main title
slide1.addText("Complete Brand Redesign", {
  x: 0.5,
  y: 2,
  w: 9,
  h: 1.2,
  fontSize: 54,
  fontFace: "Georgia",
  bold: true,
  color: lightText,
  align: "left",
  valign: "top",
});

// Subtitle
slide1.addText("Green Color System × Modern UI", {
  x: 0.5,
  y: 3.3,
  w: 9,
  h: 0.8,
  fontSize: 28,
  fontFace: "Calibri",
  color: greenBright,
  align: "left",
  valign: "top",
});

// Bottom accent
slide1.addText(
  "From legacy wheat tones to forest green — unified brand identity across web and mobile.",
  {
    x: 0.5,
    y: 5,
    w: 9,
    h: 1,
    fontSize: 14,
    fontFace: "Calibri",
    color: mutedText,
    align: "left",
    valign: "top",
  }
);

// ===== SLIDE 2: Design System Overview =====
const slide2 = pres.addSlide();
slide2.background = { color: darkBg };

// Header
slide2.addShape(pres.ShapeType.rect, {
  x: 0,
  y: 0,
  w: "100%",
  h: 0.8,
  fill: { color: green },
  line: { type: "none" },
});

slide2.addText("Brand Identity System", {
  x: 0.5,
  y: 0.15,
  w: 9,
  h: 0.5,
  fontSize: 32,
  fontFace: "Georgia",
  bold: true,
  color: darkBg,
  align: "left",
  valign: "middle",
});

// Color palette boxes
const colors = [
  { name: "Primary Green", hex: green, usage: "Main UI elements" },
  {
    name: "Medium Green",
    hex: greenLight,
    usage: "Secondary accents",
  },
  { name: "Bright Emerald", hex: greenBright, usage: "Hover states" },
  { name: "Light Green", hex: greenExtra, usage: "Subtle backgrounds" },
];

let yPos = 1.3;
colors.forEach((color, idx) => {
  // Color box
  slide2.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: yPos,
    w: 0.6,
    h: 0.6,
    fill: { color: color.hex },
    line: { type: "none" },
  });

  // Color name
  slide2.addText(color.name, {
    x: 1.3,
    y: yPos,
    w: 2,
    h: 0.3,
    fontSize: 14,
    fontFace: "Calibri",
    bold: true,
    color: lightText,
    align: "left",
    valign: "top",
  });

  // Hex code
  slide2.addText(color.hex, {
    x: 1.3,
    y: yPos + 0.3,
    w: 2,
    h: 0.25,
    fontSize: 11,
    fontFace: "Consolas",
    color: mutedText,
    align: "left",
    valign: "top",
  });

  // Usage
  slide2.addText(color.usage, {
    x: 4,
    y: yPos,
    w: 5.5,
    h: 0.6,
    fontSize: 13,
    fontFace: "Calibri",
    color: lightText,
    align: "left",
    valign: "middle",
  });

  yPos += 0.9;
});

// ===== SLIDE 3: Landing Page Hero =====
const slide3 = pres.addSlide();
slide3.background = { color: darkBg };

slide3.addText("Landing Page Redesign", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Georgia",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

// Hero section card
slide3.addShape(pres.ShapeType.rect, {
  x: 0.5,
  y: 1.1,
  w: 9,
  h: 3.8,
  fill: { color: darkCard },
  line: { color: green, width: 1 },
});

slide3.addText("Join the Agricultural Revolution", {
  x: 0.8,
  y: 1.4,
  w: 8.4,
  h: 0.8,
  fontSize: 32,
  fontFace: "Georgia",
  bold: true,
  color: lightText,
  align: "left",
  valign: "top",
});

slide3.addText(
  "Secure trades on blind trust with blockchain-backed escrow. Connect buyers, sellers, inspectors, and transporters in one platform.",
  {
    x: 0.8,
    y: 2.3,
    w: 8.4,
    h: 1,
    fontSize: 14,
    fontFace: "Calibri",
    color: mutedText,
    align: "left",
    valign: "top",
  }
);

// CTA Button (green)
slide3.addShape(pres.ShapeType.roundRect, {
  x: 0.8,
  y: 3.4,
  w: 2,
  h: 0.45,
  fill: { color: greenBright },
  line: { type: "none" },
});

slide3.addText("Join Waitlist →", {
  x: 0.8,
  y: 3.4,
  w: 2,
  h: 0.45,
  fontSize: 14,
  fontFace: "Calibri",
  bold: true,
  color: darkBg,
  align: "center",
  valign: "middle",
});

// Stats section below
slide3.addText(
  "1,200+ Active Traders • $840K in Escrow • 12 Countries",
  {
    x: 0.8,
    y: 5.1,
    w: 8.4,
    h: 0.4,
    fontSize: 12,
    fontFace: "Calibri",
    color: greenExtra,
    align: "left",
    valign: "top",
  }
);

// ===== SLIDE 4: Dashboard Sidebar =====
const slide4 = pres.addSlide();
slide4.background = { color: darkBg };

slide4.addText("Unified Dashboard Navigation", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Georgia",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

// Sidebar card
slide4.addShape(pres.ShapeType.rect, {
  x: 0.5,
  y: 1.1,
  w: 2.5,
  h: 4.3,
  fill: { color: darkCard },
  line: { color: green, width: 1 },
});

// Logo section
slide4.addShape(pres.ShapeType.rect, {
  x: 0.5,
  y: 1.1,
  w: 2.5,
  h: 0.5,
  fill: { color: "rgba(61, 122, 80, 0.1)" },
  line: { type: "none" },
});

slide4.addText("🍃", {
  x: 0.7,
  y: 1.15,
  w: 0.4,
  h: 0.4,
  fontSize: 18,
  align: "center",
  valign: "middle",
});

slide4.addText("AGROTRADE", {
  x: 1.2,
  y: 1.15,
  w: 1.6,
  h: 0.4,
  fontSize: 11,
  fontFace: "Calibri",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "middle",
});

// Navigation items
const navItems = [
  { icon: "📊", label: "Dashboard", role: "Buyer" },
  { icon: "🛒", label: "Marketplace", role: "Seller" },
  { icon: "✓", label: "My Orders", role: "Inspector" },
  { icon: "🚚", label: "Shipments", role: "Transporter" },
  { icon: "⚙️", label: "Settings", role: "Admin" },
];

let navY = 1.8;
navItems.forEach((item) => {
  slide4.addText(item.icon, {
    x: 0.7,
    y: navY,
    w: 0.3,
    h: 0.35,
    fontSize: 14,
    align: "center",
    valign: "middle",
  });

  slide4.addText(item.label, {
    x: 1.1,
    y: navY,
    w: 1.6,
    h: 0.35,
    fontSize: 12,
    fontFace: "Calibri",
    color: lightText,
    align: "left",
    valign: "middle",
  });

  navY += 0.5;
});

// User profile section (bottom)
slide4.addShape(pres.ShapeType.rect, {
  x: 0.6,
  y: 4.5,
  w: 2.3,
  h: 0.7,
  fill: { color: "rgba(16, 185, 129, 0.1)" },
  line: { color: greenLight, width: 1 },
});

slide4.addText("👤", {
  x: 0.8,
  y: 4.6,
  w: 0.3,
  h: 0.5,
  fontSize: 16,
  align: "center",
  valign: "middle",
});

slide4.addText("John Seller", {
  x: 1.2,
  y: 4.6,
  w: 1.5,
  h: 0.25,
  fontSize: 11,
  fontFace: "Calibri",
  bold: true,
  color: lightText,
  align: "left",
  valign: "top",
});

slide4.addText("Farmer • Nigeria", {
  x: 1.2,
  y: 4.85,
  w: 1.5,
  h: 0.2,
  fontSize: 9,
  fontFace: "Calibri",
  color: mutedText,
  align: "left",
  valign: "top",
});

// Content area
slide4.addShape(pres.ShapeType.rect, {
  x: 3.2,
  y: 1.1,
  w: 6.3,
  h: 4.3,
  fill: { color: darkCard },
  line: { color: green, width: 1 },
});

slide4.addText("Dashboard Content", {
  x: 3.5,
  y: 1.4,
  w: 5.7,
  h: 0.4,
  fontSize: 18,
  fontFace: "Calibri",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

slide4.addText(
  "Role-based views with consistent green theming across all dashboard sections.",
  {
    x: 3.5,
    y: 1.9,
    w: 5.7,
    h: 1,
    fontSize: 12,
    fontFace: "Calibri",
    color: mutedText,
    align: "left",
    valign: "top",
  }
);

// ===== SLIDE 5: Role-Based UI =====
const slide5 = pres.addSlide();
slide5.background = { color: darkBg };

slide5.addText("Role-Based Dashboard Views", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Georgia",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

const roles = [
  { name: "Buyer", icon: "👨‍🌾", color: "#059669", desc: "Browse & purchase" },
  { name: "Seller", icon: "👩‍🌾", color: "#10b981", desc: "Manage listings" },
  { name: "Inspector", icon: "🔍", color: "#14b8a6", desc: "Quality checks" },
  { name: "Transporter", icon: "🚚", color: "#6ee7b7", desc: "Logistics" },
];

let cardX = 0.5;
roles.forEach((role) => {
  // Role card
  slide5.addShape(pres.ShapeType.rect, {
    x: cardX,
    y: 1.2,
    w: 2.2,
    h: 3.3,
    fill: { color: darkCard },
    line: { color: role.color, width: 2 },
  });

  // Icon
  slide5.addText(role.icon, {
    x: cardX,
    y: 1.5,
    w: 2.2,
    h: 0.6,
    fontSize: 32,
    align: "center",
    valign: "middle",
  });

  // Role name
  slide5.addText(role.name, {
    x: cardX + 0.2,
    y: 2.2,
    w: 1.8,
    h: 0.4,
    fontSize: 16,
    fontFace: "Calibri",
    bold: true,
    color: lightText,
    align: "center",
    valign: "top",
  });

  // Description
  slide5.addText(role.desc, {
    x: cardX + 0.2,
    y: 2.7,
    w: 1.8,
    h: 1.2,
    fontSize: 12,
    fontFace: "Calibri",
    color: mutedText,
    align: "center",
    valign: "top",
  });

  // Accent bar
  slide5.addShape(pres.ShapeType.rect, {
    x: cardX,
    y: 4.2,
    w: 2.2,
    h: 0.25,
    fill: { color: role.color },
    line: { type: "none" },
  });

  cardX += 2.3;
});

// ===== SLIDE 6: Design System Architecture =====
const slide6 = pres.addSlide();
slide6.background = { color: darkBg };

slide6.addText("Design System Architecture", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Georgia",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

// Architecture layers
const layers = [
  {
    title: "Theme Configuration",
    content: "CSS variables + brand.ts",
    color: green,
  },
  {
    title: "shadcn/ui Primitives",
    content: "Button, Card, Input, Dialog",
    color: greenLight,
  },
  {
    title: "Design System Components",
    content: "AppSidebar, DashboardTopbar",
    color: greenBright,
  },
  {
    title: "Page Components",
    content: "Dashboard views, Forms",
    color: greenExtra,
  },
];

let layerY = 1.3;
layers.forEach((layer) => {
  slide6.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: layerY,
    w: 9,
    h: 0.7,
    fill: { color: "rgba(61, 122, 80, 0.15)" },
    line: { color: layer.color, width: 2 },
  });

  slide6.addText(layer.title, {
    x: 0.8,
    y: layerY + 0.05,
    w: 3,
    h: 0.3,
    fontSize: 14,
    fontFace: "Calibri",
    bold: true,
    color: lightText,
    align: "left",
    valign: "top",
  });

  slide6.addText(layer.content, {
    x: 4,
    y: layerY + 0.05,
    w: 5.5,
    h: 0.3,
    fontSize: 13,
    fontFace: "Calibri",
    color: mutedText,
    align: "left",
    valign: "top",
  });

  slide6.addShape(pres.ShapeType.rect, {
    x: 9.3,
    y: layerY + 0.1,
    w: 0.15,
    h: 0.5,
    fill: { color: layer.color },
    line: { type: "none" },
  });

  layerY += 0.9;
});

// ===== SLIDE 7: Key Features =====
const slide7 = pres.addSlide();
slide7.background = { color: darkBg };

slide7.addText("Cohesive Brand Experience", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Georgia",
  bold: true,
  color: greenBright,
  align: "left",
  valign: "top",
});

const features = [
  {
    icon: "✓",
    title: "Consistent Color System",
    desc: "Green primary color across all UI elements",
  },
  {
    icon: "✓",
    title: "Role-Based Theming",
    desc: "Each role has distinct green variant colors",
  },
  {
    icon: "✓",
    title: "Centralized Brand Config",
    desc: "Single source of truth in brand.ts",
  },
  {
    icon: "✓",
    title: "Responsive & Accessible",
    desc: "Works across web, mobile, and tablet",
  },
  {
    icon: "✓",
    title: "Fast Rebranding",
    desc: "Change colors in <5 minutes",
  },
  {
    icon: "✓",
    title: "Professional Polish",
    desc: "Enterprise-grade design system",
  },
];

let featureY = 1.2;
features.forEach((feature, idx) => {
  // Icon circle
  slide7.addShape(pres.ShapeType.ellipse, {
    x: 0.5,
    y: featureY,
    w: 0.35,
    h: 0.35,
    fill: { color: green },
    line: { type: "none" },
  });

  slide7.addText(feature.icon, {
    x: 0.5,
    y: featureY,
    w: 0.35,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: darkBg,
    align: "center",
    valign: "middle",
  });

  // Title
  slide7.addText(feature.title, {
    x: 1.1,
    y: featureY,
    w: 4,
    h: 0.2,
    fontSize: 13,
    fontFace: "Calibri",
    bold: true,
    color: lightText,
    align: "left",
    valign: "top",
  });

  // Description
  slide7.addText(feature.desc, {
    x: 1.1,
    y: featureY + 0.2,
    w: 4,
    h: 0.2,
    fontSize: 11,
    fontFace: "Calibri",
    color: mutedText,
    align: "left",
    valign: "top",
  });

  featureY += 0.65;
});

// ===== SLIDE 8: Call to Action =====
const slide8 = pres.addSlide();
slide8.background = { color: darkBg };

// Green accent bar
slide8.addShape(pres.ShapeType.rect, {
  x: 0,
  y: 0,
  w: "100%",
  h: 1.5,
  fill: { color: green },
  line: { type: "none" },
});

slide8.addText("Ready to Transform AgroTrade?", {
  x: 0.5,
  y: 0.3,
  w: 9,
  h: 0.9,
  fontSize: 44,
  fontFace: "Georgia",
  bold: true,
  color: darkBg,
  align: "left",
  valign: "top",
});

// CTA boxes
const ctaBoxes = [
  { number: "1", title: "Deploy", subtitle: "Launch green-themed web app" },
  { number: "2", title: "Expand", subtitle: "Roll out to all dashboard pages" },
  { number: "3", title: "Market", subtitle: "Promote unified brand identity" },
];

let ctaX = 0.5;
ctaBoxes.forEach((box) => {
  slide8.addShape(pres.ShapeType.rect, {
    x: ctaX,
    y: 2,
    w: 2.8,
    h: 2.5,
    fill: { color: darkCard },
    line: { color: greenBright, width: 1 },
  });

  slide8.addText(box.number, {
    x: ctaX,
    y: 2.2,
    w: 2.8,
    h: 0.6,
    fontSize: 48,
    fontFace: "Georgia",
    bold: true,
    color: greenBright,
    align: "center",
    valign: "top",
  });

  slide8.addText(box.title, {
    x: ctaX + 0.2,
    y: 2.95,
    w: 2.4,
    h: 0.4,
    fontSize: 16,
    fontFace: "Calibri",
    bold: true,
    color: lightText,
    align: "center",
    valign: "top",
  });

  slide8.addText(box.subtitle, {
    x: ctaX + 0.2,
    y: 3.4,
    w: 2.4,
    h: 0.8,
    fontSize: 11,
    fontFace: "Calibri",
    color: mutedText,
    align: "center",
    valign: "top",
  });

  ctaX += 3.15;
});

// Save presentation
pres.writeFile({ fileName: "AgroTrade_Brand_Redesign.pptx" });
console.log("✓ Pitch deck created: AgroTrade_Brand_Redesign.pptx");
