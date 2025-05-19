# Version Management

This document outlines the version management strategy for the Yippie-Bot project.

## Semantic Versioning

Yippie-Bot follows [Semantic Versioning 2.0.0](https://semver.org/) for version numbering. Each version number consists of three parts: `MAJOR.MINOR.PATCH`

- **MAJOR** version is incremented for incompatible API changes (breaking changes)
- **MINOR** version is incremented for added functionality in a backward compatible manner
- **PATCH** version is incremented for backward compatible bug fixes

Example: `2.3.5` indicates major version 2, minor version 3, and patch version 5.

## Changelog

All notable changes to the project are documented in the [CHANGELOG.md](../CHANGELOG.md) file in the root of the repository. The changelog follows the [Keep a Changelog](https://keepachangelog.com/) format, which organizes changes into the following categories:

- **Added** - for new features
- **Changed** - for changes in existing functionality
- **Deprecated** - for soon-to-be removed features
- **Removed** - for now removed features
- **Fixed** - for any bug fixes
- **Security** - in case of vulnerabilities

## Breaking Changes

Breaking changes are changes that might require users to modify their code or usage of the bot. These include:

- Removing or renaming commands
- Changing command parameters
- Modifying the behavior of existing commands in a way that changes their output
- Changing configuration formats
- Modifying API endpoints or response structures

### Handling Breaking Changes

When implementing breaking changes:

1. **Increment the MAJOR version number** (e.g., from 2.x.x to 3.0.0)
2. **Document the breaking change** in the CHANGELOG.md with a "BREAKING" label
3. **Provide migration instructions** explaining how users should adapt to the change
4. When possible, **implement deprecation warnings** before removing features

Example changelog entry for a breaking change:
```
## [3.0.0] - 2025-06-15
### Changed
- BREAKING: Renamed !play command to !music-play. Update your command usage accordingly.
```

## Version Management Workflow

When making changes to the codebase:

1. Determine the type of change (patch, minor, or major)
2. Update the version number in package.json
3. Add an entry to CHANGELOG.md describing the change
4. If it's a breaking change, follow the breaking change guidelines above
5. Commit the changes with a message that includes the new version number

## Release Process

1. Ensure all changes are documented in the CHANGELOG.md
2. Update the version in package.json
3. Build and deploy the new version