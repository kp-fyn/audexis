---
layout: "../../../layouts/MarkdownLayout.astro"
title: "Troubleshooting"
description: "Troubleshooting guide for Audexis. Find solutions to common problems with audio metadata editing, file loading, and tag saving issues."
keywords: "audexis troubleshooting, common problems, fix audio tags, metadata errors, tag editor issues, file loading problems"
---

# Troubleshooting

## App Won't Open

**macOS security warning**:

1. Right-click Audexis.app
2. Select **Open**
3. Click **Open** in the dialog

If that doesn't work:

```bash
xattr -cr /Applications/Audexis.app
```

## Files Won't Import

**Check**: Only MP3, FLAC, M4A, and MP4 files are supported

**Solution**: Verify file isn't corrupted by opening it in another app

## Can't Edit Files

**Check file permissions**: Files might be read-only

```bash
chmod u+w /path/to/file.mp3
```

**Check**: Close other apps that might be using the file

## Changes Won't Save

1. Ensure files aren't open elsewhere
2. Check file permissions (make sure they're writable)
3. Check "Get Info" in Finder and uncheck "Locked"

## Album Art Not Showing

1. Enable **Attached Picture** column in Settings → Columns
2. Verify the file actually has embedded artwork
3. Try re-importing the image

## Update Not Working

1. Check internet connection
2. Wait 5 minutes for the next check
3. Download manually from [GitHub](https://github.com/kp-fyn/audexis/releases)

## Still Need Help?

- [Report a bug](https://github.com/kp-fyn/audexis/issues)
- [Ask a question](https://github.com/kp-fyn/audexis/discussions)

Include:

- Your macOS version
- Audexis version (Settings → check bottom)
- What you tried
- Any error messages
