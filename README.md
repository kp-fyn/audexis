# Audexis

Audexis is an open-source, cross-platform audio metadata editor built with Tauri and React. It provides a clean and efficient interface for editing tags such as title, artist, album, artwork, track numbers, and more. Designed for power users and everyday listeners, Audexis offers batch editing, fast scanning, and broad format support.

## Features

- Cross-platform desktop application (Windows, macOS)
- Modern UI built with React and TailwindCSS
- Batch edit audio metadata
- Edit artwork, embedded images
- Multi-format support: MP3, M4A/MP4
- Automatic updater (Tauri Updater)
- Open source

## Installation

Download the latest release for your operating system from the Releases section.

Windows: `.msi` or `.exe` installer  
macOS: `.dmg`

## Building From Source

Prerequisites:

- Node.js (18+)
- Rust and Cargo
- npm

Clone the repository:

```
git clone https://github.com/kp-fyn/audexis
cd audexis/apps/desktop
```

## Install dependencies

```
npm install
```

## Build

```
npm run tauri build
```

## Contributing

Contributions are welcome.  
Feel free to open issues for bugs, feature requests, or questions.

## License

This project is licensed under the MIT License.
