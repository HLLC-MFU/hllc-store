---
name: HLLC Store Design System
description: Minimalist e-commerce shop and admin dashboard design tokens.
colors:
  primary: "#85241F"
  primary-hover: "#B72D2A"
  primary-tint: "rgba(133, 36, 31, 0.05)"
  background: "#f8fafc"
  surface: "#ffffff"
  foreground: "#111827"
  border: "#f3f4f6"
  receipt-bg: "#f1f5f9"
  receipt-border: "#cbd5e1"
typography:
  display:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: HLLC Store

## 1. Overview

**Creative North Star: "The Utilitarian Crimson"**

HLLC Store design system focuses on high-efficiency, clutter-free layouts that serve the product first. The primary accent is a signature dark crimson red (#85241F), paired with an off-white background (#f8fafc) and stark monospace-accented blocks for a technical, physical-receipt-inspired checkout experience.

**Key Characteristics:**
- Stark, crisp borders (no heavy blur shadows).
- High layout density with clear visual boundaries.
- Precise typography contrast using font-sans for content and font-mono for technical outputs.

## 2. Colors

The color palette uses high-contrast neutral scales with a committed crimson accent.

### Primary
- **Crimson Red** (#85241F): Primary actions, critical active states, highlighted totals, and branding markers.
- **Bright Crimson** (#B72D2A): Used exclusively for button hover states.
- **Crimson Tint** (rgba(133, 36, 31, 0.05)): Soft background highlights for badges, alerts, or active rows.

### Neutral
- **Body Background** (#f8fafc): Cool off-white background slate to separate container boundaries.
- **Surface** (#ffffff): Clean white backgrounds for containers, cards, and input panels.
- **Ink Text** (#111827): Dark neutral charcoal for primary readable body copy.
- **Muted Ink** (#6b7280): Medium neutral gray for label text and secondary information.
- **Borders** (#f3f4f6): Soft divider color for clean spacing boundaries.

### Named Rules
**The 10% Crimson Rule.** Crimson (#85241F) is active. No more than 10% of any screen layout should contain solid crimson fills. Its scarcity ensures it commands immediate attention.

## 3. Typography

**Display Font:** var(--font-geist-sans), sans-serif
**Body Font:** var(--font-geist-sans), sans-serif
**Label/Mono Font:** var(--font-geist-mono), monospace

### Hierarchy
- **Display** (bold (900), clamp(2rem, 5vw, 3rem), 1.1): Hero banners and shop main page headers.
- **Headline** (bold (800), 1.5rem, 1.2): Section titles and modal headers.
- **Title** (bold (700), 1.125rem, 1.3): Card headings and field label summaries.
- **Body** (medium (500), 0.875rem, 1.5): Description copy, items list, and main readable outputs.
- **Label** (bold (700), 0.75rem, normal): Badges, tiny uppercase tabs, and receipt technical detail lines.

## 4. Elevation

The system is flat by default. Depth is conveyed using crisp borders rather than soft wide shadows.

### Named Rules
**The State-Activated Shadow Rule.** Containers use thin borders (#f3f4f6) at rest. Box shadows are small (blur ≤ 8px) and appear only as responsive interactive feedback during hover or focus states.

## 5. Components

### Buttons
- **Shape:** Medium corner radius (12px / rounded-xl) for buttons.
- **Primary:** Filled crimson (#85241F) with white text, using precise vertical and horizontal padding.
- **Hover / Focus:** Transitions opacity or colors smoothly to bright crimson (#B72D2A) on hover.

### Cards / Containers
- **Corner Style:** Large corner radius (16px / rounded-2xl).
- **Background:** White (#ffffff) or soft gray (#f8fafc).
- **Border:** Thin solid gray border (1px solid #f3f4f6).

### Inputs / Fields
- **Style:** 12px rounded corner inputs with border-gray-200.
- **Focus:** Border shifts to primary crimson (#85241F) with a subtle outline rings.

### Signature Component: The Cash Receipt
- **Background:** Soft cool slate-gray (#f1f5f9) mimicking thermal paper.
- **Borders:** Dashed side borders (#cbd5e1) and high-fidelity repeating SVG top/bottom jagged edges.
- **Font:** Monospace font-mono exclusively.

## 6. Do's and Don'ts

### Do:
- **Do** pair thin borders with tiny ambient shadows (blur < 8px).
- **Do** keep display headers clamped at reasonable mobile/desktop sizes.
- **Do** use uppercase strictly for short badges or technical receipts.

### Don't:
- **Don't** use neon color gradients or text gradient fills.
- **Don't** use large card radii (32px+).
- **Don't** use side-stripe accent borders on cards or notifications.
