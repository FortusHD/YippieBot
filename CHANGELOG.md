# Changelog

All notable changes to the Yippie-Bot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.14] - 2026-10-08
### Security
- Secrets are no longer logged (Lavalink password, parts of the bot token).
- Docker image runs as the unprivileged `node` user and has a `HEALTHCHECK`; GitHub Actions are pinned to commit SHAs and CI runs with read-only permissions.
- Health endpoint listens on `127.0.0.1` by default (`HTTP_HOST` to change), `x-powered-by` is disabled.
- YouTube API parameters are URL-encoded; requests have a timeout and check the response status.
- `/roll`: limits for prompt length, number of groups, dice, sides and modifier.
- Admin alerts are rate limited (no duplicates within 60s, max 5 per minute) and the context is truncated.
- `/skip` and the skip button now require the user to be in the voice channel of the bot.

### Fixed
- Poll results are only removed from the database after they were sent; deleted polls/messages and removed reactions no longer cause unhandled rejections. The loop runs every 15s and cannot overlap.
- `/poll`: strict time format (max. 30 days), length limits for question/answers, `max_votes` between 1 and 15.
- `/wichteln`: strict date validation (real date in the future), limits for the participation time, no second start while a wichteln is running.
- `insertPoll` released its database connection twice.
- Unknown buttons/modals are reported with the correct id and error type.
- Failing to move a prisoner (missing permissions) no longer causes an unhandled rejection.
- `getOrCreatePlayer` waits for the Lavalink connection instead of a fixed 2 seconds and handles users without voice channel.
- Image list for the "hunt" answer is cached.
- `raw` event: discord.js emits it with `(packet, shardId)`, so the client passed by `main.js` must be read from the last argument (voice join/leave crashed the bot).
- Errors in event handlers are caught and reported per event instead of ending up as uncaught exceptions (which stop the process).

### Changed
- Docker base image pinned to a digest; `nodemon` updated to 3.x and `husky` to 9.x (`prepare` script and pre-commit hook adapted).
- Only the bot credentials of the current `APP_ENV` are required; `formatMessage` replaces all placeholders; `LAVALINK_PORT` is parsed safely.
- Database setup no longer needs root access and no longer runs `CREATE DATABASE/USER`, `GRANT` and `FLUSH PRIVILEGES` on every start (this caused the MySQL warnings in the database log). The database and user are created by the database container (`MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`); the bot waits up to ~30s for the database and only creates its tables. `DB_ROOT_PASSWORD` is no longer used by the bot.
- Database setup errors are no longer swallowed: the bot exits if the database cannot be set up.
- Graceful shutdown on `SIGTERM`/`SIGINT`; the process exits after an uncaught exception (restart via Docker).
- Events receive the client as last argument, `raw` no longer imports `main.js` (circular import removed).
- `deploy()` errors are handled.

## [3.0.13] - 2026-10-08
### Added
- GitHub Actions workflows for CI (`ci.yml`) and deployment (`deploy.yml`), running on Ubuntu 24.04.
- `config/default.example.json` as example configuration (also used by CI).

### Fixed
- `/queue remove`: position validation and index handling were off by one. Valid positions are now `1` to `queue.size`, and the correct track is removed.

### Changed
- Updated tests (`join`, `queue`, database tables, config) to match the new behavior and error message paths.

## [3.0.12] - 2026-10-06
### Changed
- Updated dependencies.

## [3.0.11] - 2026-08-13
### Added
- "Street Fighter" role: new role/emoji entries in the configuration (`roles.streetFighter`, `emojis.streetFighter`), shown in the role-selection embed and assigned/removed via reactions. Includes tests.

## [3.0.10] - 2026-05-17
### Changed
- `getOrCreatePlayer` is now async and tries to reconnect to the Lavalink node if it is disconnected before giving up.
- `join` now uses `getOrCreatePlayer`; `play` awaits it.
- `lavalinkLoop` no longer crashes if the Lavalink node is not found.

## [3.0.9] - 2026-05-01
### Fixed
- Wrong function call in `getLavalinkNotConnectedMessage` (admin user ID was invoked as a function).

## [3.0.8] - 2026-05-01
### Added
- Global handlers for `unhandledRejection` and `uncaughtException`, routed through the central error handling.
- Riffy reconnect settings (`reconnectTries: 15`, `reconnectTimeout: 10000`).

### Deprecated
- `lavalinkLoop` is no longer started on `ready`.

## [3.0.2] - [3.0.7] - 2025-12-18 to 2026-05-01
### Fixed
- `getWichtelData` now also handles database values that are already parsed JSON instead of only strings (3.0.2).

### Changed
- Regular dependency updates.

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
