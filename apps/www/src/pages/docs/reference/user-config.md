---
layout: "../../../layouts/MarkdownLayout.astro"
title: "User Configuration"
description: "Advanced configuration options for Audexis. Learn how to customize settings, manage preferences, and configure the application to your workflow."
keywords: "audexis config, user preferences, configuration file, advanced settings, app customization"
---

# User Configuration

Audexis stores your preferences in a configuration file.

## File Location

```
~/Library/Application Support/com.audexis/config.json
```

## What's Saved

- Theme (light/dark)
- View mode (folder/simple)
- Density (compact/default/comfort)
- Visible columns and their order
- Column widths

## Editing Configuration

**Recommended**: Use Settings (⌘+,) to change preferences

## Configuration Schema

The configuration file contains the following fields:

```json
{
  "theme": "light" | "dark",
  "view": "folder" | "simple",
  "density": "default" | "compact" | "comfort",
  "onboarding": boolean,
  "columns": [
    {
      "label": "Title",
      "value": "title",
      "size": 200,
      "kind": "Text"
    }
    // ... more columns
  ],
  "albums": []
}
```

## Configuration Fields

### theme

Controls the application's color scheme.

**Values**:

- `"light"` — Light theme with bright backgrounds
- `"dark"` — Dark theme with dark backgrounds

**Default**: `"light"`

**How to change**: Settings → Appearance → Theme

### view

Determines how files are displayed in the workspace.

**Values**:

- `"folder"` — Groups files by their folder path (hierarchical)
- `"simple"` — Shows a flat list of all files

**Default**: `"folder"`

**How to change**: Settings → Appearance → View (planned feature)

### density

Controls spacing and sizing of UI elements.

**Values**:

- `"compact"` — Tighter spacing, fits more on screen
- `"default"` — Balanced spacing
- `"comfort"` — Generous spacing, easier to read

**Default**: `"default"`

**How to change**: Settings → Appearance → Density

### onboarding

Indicates whether the onboarding modal should appear on launch.

**Values**:

- `true` — Show onboarding on next launch
- `false` — Skip onboarding

**Default**: `true` (for new installations)

**How it changes**: Automatically set to `false` after completing onboarding

### columns

An array of column configuration objects.

**Column object structure**:

```json
{
  "label": "Title", // Display name
  "value": "title", // Internal field name
  "size": 200, // Width in pixels
  "kind": "Text" // "Text" or "Image"
}
```

**How to change**: Settings → Columns (add/remove/reorder)

### albums

Reserved for future album-based features.

**Current status**: Not used in version 0.2.x

**Planned use**: Will store album groupings and artwork associations

## Editing the Configuration

### Via Settings

Always use the Settings UI (⌘+,) to modify configuration:

- Changes are validated
- Updates apply immediately
- No risk of breaking the JSON syntax

**pls don't manually edit the JSON file unless you know what you're doing**

## Related Documentation

- [Appearance Settings](/docs/settings/appearance) — Theme and density
- [Behavior Settings](/docs/settings/behavior) — Interaction preferences
- [Column Settings](/docs/settings/columns) — Column configuration
