# DAS Color System Guidelines

## 🎨 Official Color Palette

This document defines the **official color system** for the DAS School Management System. All components, pages, and future development must follow these guidelines to maintain visual consistency and the modern iOS-style design language.

---

## Core Brand Colors

### 1. **Primary Color - Blue** (Main Brand Color)

- **CSS Variable:** `hsl(var(--primary))`
- **Tailwind Class:** `bg-primary`, `text-primary`, `border-primary`
- **HSL Value:** `211 86% 56%` (Light mode), `211 86% 64%` (Dark mode)
- **Description:** Softer iOS-style blue, professional and modern
- **Use Cases:**
  - Primary action buttons
  - Main navigation highlights
  - Important headings and links
  - Focus states and rings
  - System icons and branding
  - Progress indicators

### 2. **Accent Color - Amber/Yellow** (Primary Accent)

- **CSS Variable:** `hsl(var(--accent))`
- **Tailwind Class:** `bg-accent`, `text-accent`, `border-accent`
- **HSL Value:** `38 92% 58%` (Light mode), `38 92% 66%` (Dark mode)
- **Description:** Warm amber-yellow, comfortable and inviting
- **Use Cases:**
  - Secondary action buttons
  - Highlights and callouts
  - Warning states (informational)
  - Morning session indicators
  - Special badges and tags
  - Glow effects

### 3. **Secondary Color - Coral/Orange** (Secondary Accent)

- **CSS Variable:** `hsl(var(--secondary))`
- **Tailwind Class:** `bg-secondary`, `text-secondary`, `border-secondary`
- **HSL Value:** `14 90% 62%` (Light mode), `14 90% 68%` (Dark mode)
- **Description:** Balanced coral-orange, warm and energetic
- **Use Cases:**
  - Tertiary actions
  - Finance-related indicators
  - Important notifications (non-critical)
  - Statistical highlights
  - Evening session indicators
  - Category differentiation

---

## Semantic Colors

### Success (Green)

- **Tailwind Classes:** `bg-green-500`, `text-green-600`, `border-green-500`
- **Use Cases:** Success messages, completed tasks, available slots

### Warning (Use Secondary/Accent)

- **Tailwind Classes:** `bg-accent` or `bg-secondary` depending on context
- **Use Cases:** Warnings, important notices, pending actions

### Error/Destructive (Red)

- **CSS Variable:** `hsl(var(--destructive))`
- **Tailwind Classes:** `bg-destructive`, `text-destructive`
- **Use Cases:** Error messages, delete actions, critical alerts

### Info (Use Primary)

- **Tailwind Classes:** `bg-primary`, `text-primary`
- **Use Cases:** Informational messages, tooltips, help text

---

## Color Combinations & Backgrounds

### Light Backgrounds

- **Primary Light:** `bg-primary/10` or `bg-primary/20`
- **Accent Light:** `bg-accent/10` or `bg-accent/20`
- **Secondary Light:** `bg-secondary/10` or `bg-secondary/20`

### Text on Colored Backgrounds

- **Primary Foreground:** `text-primary-foreground` (white)
- **Accent Foreground:** `text-accent-foreground` (dark gray)
- **Secondary Foreground:** `text-secondary-foreground` (white)

---

## ⛔ Deprecated Color Classes

**DO NOT USE** these Tailwind color classes in new code:

### Blue Shades (Use Primary Instead)

❌ `blue-100`, `blue-200`, `blue-300`, `blue-400`, `blue-500`, `blue-600`, `blue-700`, `blue-800`, `blue-900`
✅ Use: `primary`, `primary/10`, `primary/20`, etc.

### Yellow Shades (Use Accent Instead)

❌ `yellow-100`, `yellow-200`, `yellow-300`, `yellow-400`, `yellow-500`, `yellow-600`, `yellow-700`, `yellow-800`, `yellow-900`
✅ Use: `accent`, `accent/10`, `accent/20`, etc.

### Amber Shades (Use Accent Instead)

❌ `amber-100`, `amber-200`, `amber-300`, `amber-400`, `amber-500`, `amber-600`, `amber-700`, `amber-800`, `amber-900`
✅ Use: `accent`, `accent/10`, `accent/20`, etc.

### Orange Shades (Use Secondary Instead)

❌ `orange-100`, `orange-200`, `orange-300`, `orange-400`, `orange-500`, `orange-600`, `orange-700`, `orange-800`, `orange-900`
✅ Use: `secondary`, `secondary/10`, `secondary/20`, etc.

---

## Migration Guide

### Before (Old Code)

```tsx
<Button className="bg-blue-600 hover:bg-blue-700">Click Me</Button>
<div className="text-yellow-500">Warning</div>
<Badge className="bg-orange-100 text-orange-800">Status</Badge>
```

### After (New Code)

```tsx
<Button className="bg-primary hover:bg-primary/90">Click Me</Button>
<div className="text-accent">Warning</div>
<Badge className="bg-secondary/10 text-secondary">Status</Badge>
```

---

## Role-Based Color Assignments

### User Roles

- **Director:** `primary` (Blue)
- **Finance:** `secondary` (Coral/Orange)
- **Morning School:** `accent` (Amber/Yellow)
- **Evening School:** `primary` variant or `purple` (keep existing purple for distinction)

### Session Types

- **Morning:** `accent` (Amber/Yellow) with `Sun` icon
- **Evening:** `primary` (Blue) or keep existing dark blue/purple

---

## Gradients

### Hero Gradients

- **Primary-to-Accent:** `bg-gradient-to-r from-primary to-accent`
- **Primary-to-Secondary:** `bg-gradient-to-r from-primary to-secondary`
- **Accent-to-Secondary:** `bg-gradient-to-r from-accent to-secondary`

### Subtle Backgrounds

- **Primary Gradient:** `bg-gradient-to-br from-primary/5 to-primary/10`
- **Accent Gradient:** `bg-gradient-to-br from-accent/5 to-accent/10`

---

## Component-Specific Guidelines

### Cards

- **Default:** `bg-card` with `border border-border`
- **Highlighted:** `bg-primary/5 border-primary/20`
- **Warning:** `bg-accent/10 border-accent/30`
- **Alert:** `bg-secondary/10 border-secondary/30`

### Badges

- **Primary:** `bg-primary text-primary-foreground`
- **Accent:** `bg-accent/20 text-accent-foreground border-accent`
- **Secondary:** `bg-secondary/20 text-secondary-foreground border-secondary`

### Buttons

- **Primary Action:** `bg-primary text-primary-foreground hover:bg-primary/90`
- **Secondary Action:** `bg-accent text-accent-foreground hover:bg-accent/90`
- **Tertiary Action:** `bg-secondary text-secondary-foreground hover:bg-secondary/90`

### Icons

- **Informational:** `text-primary`
- **Warning:** `text-accent`
- **Alert:** `text-secondary`
- **Success:** `text-green-500`
- **Error:** `text-destructive`

---

## Dark Mode Considerations

All color variables automatically adjust for dark mode. The system uses:

- Slightly brighter, more saturated colors in dark mode
- Reduced opacity for backgrounds
- Increased contrast for text

**No manual dark mode color adjustments needed** - the CSS variables handle it automatically!

---

## Future Development Rules

### ✅ DO:

1. Always use CSS variable-based colors (`primary`, `accent`, `secondary`)
2. Use semantic opacity for backgrounds (e.g., `bg-primary/10`)
3. Reference this guide when implementing new features
4. Test colors in both light and dark modes
5. Use the existing color palette for consistency

### ❌ DON'T:

1. Introduce new hardcoded Tailwind color classes
2. Use hex color codes in components
3. Create custom color values without documentation
4. Mix old (blue-500) and new (primary) color systems
5. Override theme colors with inline styles

---

## Testing Checklist

Before merging new features, verify:

- [ ] No hardcoded blue/yellow/orange Tailwind classes
- [ ] Colors work in both light and dark modes
- [ ] Hover states use proper opacity variants
- [ ] Text contrast meets accessibility standards
- [ ] Component matches iOS design language

---

## Questions?

If you need a color that doesn't fit the current palette:

1. Check if an existing color can work with opacity
2. Consider if it's truly needed or if it breaks consistency
3. Document the use case and propose it for review
4. Update this guide if a new color is approved

---

**Last Updated:** 2025-11-18  
**Version:** 1.0.0  
**Maintained By:** DAS Development Team
