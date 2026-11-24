# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Yippie-Bot is a private Discord bot (discord.js v14, CommonJS, Node 22) with music playback (Riffy → Lavalink), polls, Wichteln (Secret Santa), team randomizer and misc utility commands. User-facing strings (command descriptions, replies, help categories) are in German; code, comments and docs are in English.

## Commands

```powershell
npm run quick-start     # nodemon, auto-reload (development)
npm start               # node src/main/main.js
npm run lint            # eslint . (CI runs this)
npm run lint:fix
npm test                # jest
npx jest __tests__/commands/skip.test.js        # single test file
npx jest -t "name of test"                      # single test by name
npm run test:coverage
```

- A husky pre-commit hook runs `lint-staged` (`eslint --fix` on staged `*.js`).
- CI (`.github/workflows/ci.yml`): lint + test on Node 22. Tests mirror `src/` under `__tests__/`; shared mocks live in `__tests__/__mocks__`.

## Configuration

- Secrets/environment come from `.env` (copy `.env.example`). `src/util/config.js` validates required variables at import time and calls `process.exit(1)` if any are missing. Always read env/config through this module (`getEnv`, etc.), not `process.env` directly.
- `APP_ENV` (`dev`/`prod`) selects `BOT_TOKEN_DEV|PROD` and `BOT_CLIENT_ID_DEV|PROD`.
- Non-secret config (guild/channel/role IDs, ...) is in `config/default.json` (loaded via the `config` package; see `config/README.md`, `config/default.example.json`; `config/test.json` is used under Jest).
- `DEPLOY=true` registers slash commands with Discord on startup (`src/main/deployCommands.js`). Without it, new/changed command definitions are NOT pushed to Discord.

## Architecture

**Startup (`src/main/main.js`)**: optional command deploy → `database.setup()` (runs migrations) → create the discord.js `Client` (default `allowedMentions: { parse: [] }`, so nothing pings unless a message opts in) → attach `client.commands/buttons/modals` Collections and `client.riffy` → auto-load components → start health endpoint (`src/health`) → login. Background loops live in `src/threads/` (`pollLoop`, `wichtelLoop`, `lavalinkLoop`, `logLoop`) and are started from the `ready` event.

**Auto-loaded components**: `initializeComponents` (`src/util/util.js`) loads every `.js` file in a directory and registers it if it has the expected shape. Adding a file is enough; no central registry:
- `src/commands/*` – export `{ data: SlashCommandBuilder, execute(interaction), guild, dm, player, help: { category, usage } }`. `interactionCreated` enforces the flags: `guild` / `dm` (allowed in guild / DM) and `player` (requires an active Riffy player in the guild).
- `src/buttons/*`, `src/modals/*` – keyed by `data.data.custom_id`.
- `src/events/*` – export `{ name, once?, execute }`. `main.js` wraps every listener, appends `client` as the **last** argument and routes errors to `handleError`, so handlers must not throw to signal control flow.
- `src/riffy/{node,track}/*` – Riffy/Lavalink event listeners, named after the event (file name used if `name` is absent).

**Music**: commands/buttons delegate to `src/util/musicUtil.js`; Lavalink connection config comes from `config.getLavalinkConfig()`.

**Database (MySQL via mysql2)**:
- `src/database/database.js` owns the pool (`getConnection`, `setup`, `close`). `src/database/tables/*` contain **queries only, no schema**.
- Use `withConnection({ file, error, fallback }, fn)` (`src/database/withConnection.js`) for table functions: it always releases the connection and logs errors instead of throwing, returning `fallback`.
- Schema changes are numbered migrations in `src/database/migrations/NNN_description.js` (`{ description, async up(connection) }`), applied by `migrator.js` and tracked in `schema_migrations`. Never edit an already-applied migration; MySQL DDL isn't transactional, so make migrations repeatable (`IF NOT EXISTS`, `information_schema` checks, see `_helpers.js`). See `src/database/migrations/README.md`. Backup notes: `docs/database-backup.md`.

**Errors/logging**: use `src/logging/logger.js` (pass `__filename` where supported) and `handleError(error, source, { type: ErrorType.X, ... })` from `src/logging/errorHandler.js`. Never log credentials.

## Versioning and changelog

Before anything is merged into `prod`, the version must be bumped and documented:

1. Bump the version in `package.json` **and** `package-lock.json` (semver: patch = fixes, minor = new backwards-compatible features, major = breaking changes such as removed/renamed commands or changed config formats). Use `npm version <patch|minor|major> --no-git-tag-version` so both files stay in sync.
2. Add a `## [x.y.z] - YYYY-MM-DD` entry at the top of `CHANGELOG.md` (Keep a Changelog format; sections `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`; prefix breaking changes with `BREAKING:`).
3. The changelog's top version must equal the `package.json` version. Check both before bumping, since they can drift apart.

The version is read from `package.json` via `src/util/readVersion.js`. More details: `docs/versioning.md`.

## Further docs

`docs/architecture.md`, `docs/developer-guide.md`, `docs/versioning.md`.
