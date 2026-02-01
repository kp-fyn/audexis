---
layout: "../../../layouts/MarkdownLayout.astro"
title: "Updates"
description: "Learn how Audexis handles updates. Understand automatic updates, update notifications, and how to keep your audio metadata editor current."
keywords: "audexis updates, app updates, automatic updates, software updates, update notifications"
---

# Updates

Audexis checks for updates automatically.

## How It Works

- Checks on app launch
- Checks every 5 minutes while running
- Shows a notification when updates are available

## Installing Updates

When an update is available:

1. Click **Install Now** in the notification
2. Update downloads in the background
3. Close and reopen Audexis to complete

## Manual Update

If auto-update doesn't work:

1. Visit [GitHub Releases](https://github.com/kp-fyn/audexis/releases/latest)
2. Download the latest `.dmg`
3. Drag to Applications (replace existing)

## Check Your Version

Open Settings (⌘+,) and check the bottom of the sidebar.

## What Gets Updated

- Bug fixes
- New features
- Performance improvements

Your settings and files are not affected.

# Updates

Audexis includes built-in auto-update functionality to keep you on the latest version.

## How Auto-Updates Work

Audexis automatically checks for updates:

- **On app launch** — Checks once when you open the app
- **Every 5 minutes** — While the app is running
- **Manual trigger** — You can manually check anytime

When an update is available, you'll see a notification with options to:

- **Install Now** — Download and install immediately
- **Later** — Dismiss the notification and update later

## Update Process

### Automatic Check

1. Audexis queries the GitHub releases API
2. Compares the latest version with your installed version
3. If a newer version exists, shows an update notification

### Installation Steps

When you click "Install Now":

1. **Download** — The update downloads in the background
2. **Install** — The update is installed automatically
3. **Restart Required** — Close and reopen Audexis to complete the update

A toast notification shows the download progress.

### Update Endpoints

Audexis checks for updates at:

```
https://github.com/kp-fyn/audexis/releases/latest/download/latest.json
```

This JSON file contains version information and download URLs for each platform.

## Update Notifications

### Update Available

When a new version is detected:

- A persistent toast notification appears
- Shows the new version number (e.g., "Version 0.2.3 is ready to install")
- Offers "Install Now" and "Later" buttons

### Download Progress

While downloading:

- Shows "Downloading update..." loading indicator
- Notification can't be dismissed during download

### Installation Complete

After successful installation:

- Shows "Update installed! Close and reopen app to apply."
- You must restart Audexis to use the new version

### Update Failed

If something goes wrong:

- Shows "Update failed: [error message]"
- You can try again or download manually from GitHub

## Manual Update Check

To manually check for updates:

1. Open the browser console (if running in dev mode)
2. Run: `window.checkForUpdates()`

**Note**: Manual triggers are primarily for development and testing.

## Viewing Current Version

To see your current Audexis version:

1. Open **Settings** (⌘+,)
2. Scroll to the bottom of the sidebar
3. Your version is displayed as `v0.2.x`

Or check the About section (planned feature).
