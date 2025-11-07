# @audexis/shared

Shared styles, themes, and design tokens used across Audexis apps.

## 📦 What's Included

- **Theme Variables** - Light and dark theme CSS variables
- **Scrollbar Styles** - Custom scrollbar styling
- **Animations** - Shared animations (vibrate, etc.)
- **Base Styles** - Common HTML/body styles

## 🎨 Usage

### Import All Styles

```css
/* In your main CSS file */
@import "@audexis/shared/styles";
```

### Import Specific Parts

```css
/* Just the theme */
@import "@audexis/shared/theme";

/* Just animations */
@import "@audexis/shared/animations";
```

## 🎯 What's Shared

### Theme Colors

- Primary: `#eb5757` (Audexis red)
- Light/Dark mode support via `[data-theme]` attribute
- Full color system: background, foreground, card, popover, etc.

### Components

- Custom scrollbar (thin, themed)
- Vibrate animation
- Base typography styles

## 🔧 Customization

Edit files in `packages/shared/src/styles/`:

- `theme.css` - Color variables and themes
- `scrollbar.css` - Scrollbar styling
- `animations.css` - Keyframe animations
- `index.css` - Main entry point
