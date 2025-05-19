# Changelog

All notable changes to the Yippie-Bot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.5] - 2025-05-15
### Added
- Health check functionality
- Deletion of old logs

### Changed
- Updated dependencies to latest versions
- Improved Docker implementation with multi-stage builds and health checks

### Fixed
- Fixed issue where player.destroy could be undefined

## [2.3.4] - 2025-04-30
### Added
- Centralized error handling system
- More detailed error logging
- Improved user-facing error messages

### Changed
- Refactored duplicate code
- Extracted common functionality into utility functions

## [2.3.3] - 2025-04-15
### Added
- Proper configuration management system
- Centralized config structure with defaults
- Documentation for all configuration options

### Changed
- Replaced hardcoded values with configuration options
- Enhanced testing with unit tests for core functionality

## [2.3.2] - 2025-03-30
### Added
- JSDoc comments to all functions and classes
- Documentation for complex logic and algorithms
- Architecture diagrams

### Changed
- Standardized coding practices with ESLint
- Implemented pre-commit hooks
- Created contribution guidelines

## [2.3.1] - 2025-03-15
### Added
- Initial public release of the refactored Yippie-Bot

## Note on Versioning

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version (X.0.0): Incremented for incompatible API changes (breaking changes)
- MINOR version (0.X.0): Incremented for added functionality in a backward compatible manner
- PATCH version (0.0.X): Incremented for backward compatible bug fixes

### Breaking Changes
Breaking changes will be clearly documented in this changelog under the respective version with a "BREAKING" label. Users will be advised on how to migrate from the previous version.