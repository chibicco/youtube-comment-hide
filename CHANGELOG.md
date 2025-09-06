# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-09-07

### Added
- Real-time synchronization across all tabs and windows using chrome.storage.onChanged
- Comprehensive error handling for extension context invalidation
- Protection for all Chrome API calls with context validity checks

### Changed
- **BREAKING**: Complete rewrite of state synchronization mechanism
- Moved from visibilitychange event to chrome.storage.onChanged for cross-window sync
- Background script now only sends messages to YouTube tabs

### Fixed
- Extension context invalidated errors when tabs are opened or extension is reloaded
- State not syncing between different browser windows
- Errors when clicking extension icon on non-YouTube pages

## [1.2.3] - 2025-01-06

### Fixed
- Preserve comment visibility state on browser restart
- Prevent flickering when loading pages with saved visibility settings
- Update extension icon correctly on browser restart based on saved state

## [1.2.2] - 2025-01-06

### Fixed
- Comments visibility state not maintained when switching between videos

## [1.1.0] - Previous Release

### Added
- Toggle feature Enable/Disable on button click

### Changed
- Extract constants to shared file and improve code organization

## [1.0.0] - Initial Release

### Added
- YouTube comment hiding functionality
- Browser extension for Chrome