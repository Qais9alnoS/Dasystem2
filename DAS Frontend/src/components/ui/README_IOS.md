# iOS-Style UI Components

This directory contains iOS-inspired UI components designed specifically for the Tauri desktop application. These components provide a native iOS-like experience while maintaining compatibility with the Windows desktop environment.

## Components

### IOSSwitch

An iOS-style toggle switch with smooth animations and customizable colors.

### IOSSlider

An iOS-style slider control with track and thumb styling.

### SegmentedControl

An iOS-style segmented control for selecting between multiple options.

### IOSNavbar

An iOS-style navigation bar with back button, title, and action button support.

### IOSTabBar

An iOS-style tab bar with icons and labels, fixed at the bottom of the screen.

### IOSList

A collection of iOS-style list components including:

- IOSList: Container for list items
- IOSListItem: Individual list items with optional icons and chevrons
- IOSListHeader: Section headers for grouped lists
- IOSListFooter: Descriptive footers for lists

## Usage

To use these components, import them directly from the ui directory:

```tsx
import { IOSSwitch } from "@/components/ui/ios-switch";
import { IOSNavbar } from "@/components/ui/ios-navbar";
```

## Design Principles

These components follow iOS design guidelines including:

- Rounded corners (consistent with iOS aesthetic)
- Subtle shadows and depth effects
- Smooth animations and transitions
- Appropriate spacing and typography
- Touch-friendly sizing
- Accessibility support

## Customization

All components support customization through props and can be styled with Tailwind CSS classes. Color properties can be customized to match your app's theme.
