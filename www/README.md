# Audexis Website

Marketing website for Audexis - built with Next.js.

## Features

- 🚀 Automatically fetches latest release from GitHub
- 📦 Download button with version info and file size
- 🎨 Clean, responsive design with Tailwind CSS
- ⚡️ Static site generation for fast loading

## Development

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Building

```bash
npm run build
```

## Deployment

This site can be deployed to:

- **Vercel** (recommended) - Zero config deployment
- **GitHub Pages** - Add `output: 'export'` to `next.config.js`
- **Netlify** - Works out of the box

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

## Structure

```
website/
├── app/
│   ├── page.tsx          # Homepage with download
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── DownloadButton.tsx # Download button component
└── lib/
    └── github.ts         # GitHub API utilities
```

## Adding Documentation

To add docs later, simply create a new route:

```
app/
└── docs/
    ├── page.tsx
    └── [slug]/page.tsx
```
