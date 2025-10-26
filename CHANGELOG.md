# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Configuration option `placesAutocomplete` for customizing Google Places Autocomplete
  behavior (component restrictions, types, location bias/restriction)
- Configuration option `mapConfig` for customizing map appearance (height, center, zoom,
  gesture handling, UI controls)
- Collapsible UI wrapper for better organization
- ReactSelect-based address search with async predictions loading
- Animated center pin control on map with drag feedback
- Extensive debug logging throughout components for troubleshooting

### Changed

- **BREAKING**: Migrated AddressInput from native Google Autocomplete widget to
  ReactSelect implementation
- Default location changed from Vancouver to Victoria (48.421, -123.3692)
- Address search placeholder changed from "Street address" to "Start address"
- State field label changed from "State" to "State / Province"
- City placeholder changed from "Vancouver" to "Victoria"
- Postal code placeholder changed from "V6A 3Z7" to "V8W 3M6"
- Map center pin now uses map controls API for better full-screen support
- Improved map dragging UX with visual pin lift animation
