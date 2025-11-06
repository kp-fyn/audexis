# Audexis - Feature Roadmap

## Coming Soon

### High Priority

- [ ] Finish with file support \(mp4,m4a etc\)
- [x] Batch rename files based on metadata (e.g., `{artist} - {title}.mp3`)

- [x] Find and replace text across multiple tags

- [ ] Album Art Enhancements

  - [ ] Drag & drop album art directly onto files
  - [ ] Fetch album art from online sources (Last.fm, MusicBrainz, Spotify API)
  - [ ] Extract embedded artwork to save as file
  - [ ] Multiple images per file (front cover, back cover, artist photo)

-

### Medium Priority

- [ ] Enhanced Views

  - [ ] Album view - group by album with cover art grid
  - [ ] Artist view - group by artist
  - [ ] Tree view - hierarchical folder structure
  - [ ] Playlist import - edit metadata from M3U/PLS files

- [ ] Advanced Editing Features

  - [ ] Lyrics editor with synced/unsynced lyrics support
  - [ ] BPM detection using audio analysis
  - [ ] Key detection for DJ mixing
  - [ ] ReplayGain calculation for volume normalization
  - [ ] Custom tag fields for specialized use cases

- [ ] Organization & Library Management

  - [ ] Folder structure generator - organize files by artist/album/year
  - [ ] Duplicate finder - find duplicate songs by metadata or audio fingerprint
  - [ ] Missing artwork detector - highlight files without covers
  - [ ] Tag validation - check for empty or malformed tags
  - [ ] Export/Import - save tag configurations as templates

[ ] Smart Auto-Tagging

- [ ] Use MusicBrainz/AcoustID fingerprinting to auto-identify songs
- [ ] Fetch complete metadata from online databases
- [ ] Fix common tagging issues automatically
- [ ] Genre suggestions based on similar artists

- [ ] Built-in Audio Player

  - [ ] Preview tracks without leaving the app
  - [ ] Play/pause/skip controls
  - [ ] Waveform visualization
  - [ ] Audio seeking

- [] Search & Filter
  - [ ] Powerful query builder
  - [ ] Advanced filtering options
  - [ ] Saved search presets
  - [ ] Quick search by any field

### Lower Priority

- [ ] Audio Analysis & Visualization

  - [ ] Waveform preview for each track
  - [ ] Spectral analysis view
  - [ ] Detailed file info - codec, bitrate, sample rate display

- [ ] Automation & Workflows

  - [ ] Watch folders - auto-import from specific directories
  - [ ] Tag rules - apply automatic transformations (e.g., capitalize titles)
  - [ ] Scripts/Actions - custom JavaScript/Rust plugins
  - [ ] Undo/Redo history for all changes

- [ ] Export & Reporting

  - [ ] Export to CSV/JSON - library metadata for external tools
  - [ ] Generate reports - statistics about your library
  - [ ] Tag comparison - see differences between files
  - [ ] Change log - track what was modified

- [ ] Quality of Life Improvements
  - [x] Column reordering by drag & drop
  - [ ] Save column layouts as presets
  - [ ] Enhanced keyboard shortcuts for common actions
  - [x] Multi-select with shift/cmd+click
  - [x] Context menu - right-click actions
  - [ ] Recent files - quick access to last edited

### Special Features

- [ ] Smart Cleanup Mode

  - [ ] Remove leading "The" from artists for sorting
  - [ ] Capitalize properly (UPPERCASE to Title Case)
  - [ ] Remove extra spaces/special characters
  - [ ] Standardize featuring artists (feat. vs ft.)
  - [ ] Fix common typos in genre names

- [ ] Library Scanner

  - [ ] Scan entire music library
  - [ ] Generate quality report
  - [ ] Fix issues in bulk

- [ ] Integration Features
  - [ ] iTunes/Music.app sync - read/write to Apple Music library
  - [ ] Spotify integration - fetch metadata from Spotify
  - [] Last.fm scrobbling - tag based on listening history
  - [ ] Discogs integration - complete discography info

## Completed

- [x] Dark/Light/Auto theme support
- [x] Basic metadata editing
- [x] Column customization
- [x] Auto-updater functionality
