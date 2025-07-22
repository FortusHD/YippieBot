# Changelog

All notable changes to the Yippie-Bot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2025-07-21
### Added
- Added `getDbRootPassword` for retrieving the database root password securely.
- Updated database initialization to support user creation from root user and privilege management.


## [3.0.0] - 2025-06-24
### Added
- BREAKING: Database integration for persistent storage:
  - Added MySQL database support for storing bot data
  - Implemented database tables for various features (polls, wichtel participants, message IDs, data store)
  - Added database connection management and error handling
  - Added database configuration options in .env file (DB_HOST, DB_USER, DB_PASSWORD)

### Changed
- BREAKING: Architecture refactoring to support database integration:
  - Modified commands, events, and threads to use database storage instead of in-memory storage
  - Updated configuration system to include database settings
  - Refactored error handling to include database-related errors

## [2.6.0] - 2025-06-22
### Added
- `help` command:
  - Introduced a new `help` command to provide users with an overview of available commands and their functionalities.
  - Automatically generates a categorized, user-friendly list of commands to enhance discoverability and ease of use.

### Changed
- Embed functionality:
  - Consolidated all embed-related logic into the new `embedBuilder.js` file to improve maintainability and reusability of embed creation across the project.

## [2.5.0] - 2025-06-15
### Added
- Loop commands:
  - Introduced new commands to enable looping features for the bot, improving playback control.

### Fixed
- Queue functionality:
  - Resolved an issue where the bot would misbehave when the queue contained only one song.

### Changed
- Dependencies:
  - Updated `riffy` to the latest version.
  - Updated `axios` to the latest version.

## [2.4.1] - 2025-06-02
### Added
- Interactive buttons for enhanced user interaction:
  - `pauseResumeButton`: Toggle pause/play functionality for ongoing activities.
  - `reshuffleTeamsButton`: Enable dynamic reshuffling of teams.
  - `skipButton`: Skip the current ongoing item/task.
  - `viewQueueButton`: View the current queue more effectively.
- Comprehensive tests for interactive buttons and team randomization to ensure robust functionality.

### Changed
- Simplified commands by modularizing their logic:
  - `pause` command: Refactored to delegate core functionality to reusable utilities.
  - `teams` command: Streamlined by leveraging modular utilities for team handling and randomization.
- Migrated essential logic from `queueEmbedManager` to reusable utilities for better code maintainability.

### Removed
- `queueEmbedManager` functionality along with its associated tests, as its logic has been refactored and integrated into modular utilities.

## [2.4.0] - 2025-05-30
### Added
- New feature to send alert messages to the administrator via Discord Direct Messages (DM) when specific errors occur:
    - Introduced `sendAlert` functionality in `errorHandler` to notify admin users asynchronously on critical errors.
    - Alerts include detailed error context and timestamps for better troubleshooting.
- Improved support for Lavalink Node management with a new loop reconnection mechanism:
    - Added error logging and debugging utilities for managing Lavalink connections (`lavalinkLoop`).
    - Enhanced initialization logic to extract configurable Lavalink parameters dynamically from `src/util/config`.
- Enhanced queue management:
    - Added subcommands for queue command, allowing the user to not only view the queue but remove specific songs and clear the queue using `queue remove <position>` and `queue clear` (the queue can now be viewed by using `queue view <page?>`)
- Enhanced playlist management:
  - When adding a playlist to the queue, the user can state that the playlist should be added shuffled
  - Playlist data will now be retrieved more detailed


### Changed
- Extended `logger` to support debug messages for better diagnostic logging in different modules including Lavalink processes.

### Fixed
- Addressed race conditions in the thread-based Lavalink management system where reconnections could fail silently.

## [2.3.6] - 2025-05-20
### Added
- Security utilities:
    - **New scripts**:
        - `security:audit`: Runs `npm audit` to check for dependency vulnerabilities.
        - `security:audit:fix`: Fixes vulnerabilities automatically using `npm audit fix`.
    - Added validation of required environment variables in `src/util/config.js`.
    - Logging and immediate process termination when required variables are missing.
- Logging level:
  - Added the option to define the logging level for more detailed logs (`DEBUG | INFO | WARN | ERROR`)
  - Added debug log messages to various modules
- Alert admin
  - The admin user will now receive private messages on discord on each error

### Fixed
- Improved error visibility for missing `.env` variables with detailed logging, aiding seamless debugging.

## [2.3.5] - 2025-05-15
### Added
- Health check functionality
- Deletion of old logs

### Changed
- Updated dependencies to the latest versions
- Improved Docker implementation with multi-stage builds and health checks

### Fixed
- Fixed the issue where `player.destroy` could be undefined

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
