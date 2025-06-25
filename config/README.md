# Yippie-Bot Configuration

This document describes the configuration options for the Yippie-Bot.

## Configuration Structure

The configuration is organized into the following sections:

### Discord

Discord-specific configuration values.

```json
"discord": {
  "guild": {
    "id": "1176169369378766979"
  },
  "channels": {
    "afk": "1176170009517641869",
    "wichtel": "1176169456708370452",
    "role": "1176169372780339363",
    "bobby": "1260997849651478631"
  },
  "roles": {
    "drachi": "1176169635180195861",
    "free": "1176169662233444403",
    "nsfw": "1233797171078500437",
    "bobby": "1261008938405466224"
  },
  "emojis": {
    "drachi": "1176169724216873001",
    "free": "1176169740260085821",
    "nsfw": "1233797287206191155",
    "bobby": "1261008728522625086"
  },
  "users": {
    "admin": "279242313241329664"
  },
  "bot": {
    "deafenInVoiceChannel": true
  }
}
```

### Lavalink

Lavalink music service configuration.

```json
"lavalink": {
  "host": "localhost",
  "port": 2333,
  "password": "",
  "secure": false,
  "defaultSearchPlatform": "ytsearch",
  "restVersion": "v4"
}
```

### API

API-specific configuration values.

```json
"api": {
  "youtube": {
    "baseUrl": "https://www.googleapis.com/youtube/v3",
    "playlistEndpoint": "/playlists",
    "playlistParams": "part=snippet%2Clocalizations&fields=items(localizations%2Csnippet%2Flocalized%2Csnippet%2Ftitle%2Csnippet%2Fthumbnails)"
  }
}
```

### UI

UI-specific configuration values.

```json
"ui": {
  "embeds": {
    "titles": {
      "playlistAdded": ":notes: Playlist wurde zur Queue hinzugefügt.",
      "songAdded": ":musical_note: Song wurde zur Queue hinzugefügt."
    },
    "messages": {
      "adminCookieNotification": "Die Cookies für den Musik-Bot könnten ausgelaufen sein!",
      "lavalinkNotConnected": "Der Bot kann gerade leider keine Musik abspielen. Melde dich bei <@{adminUserId}>"
    }
  }
}
```

### HTTP

Specific configuration values for the health-check http endpoint

```json
"http": {
  "port": 7635
}
```

## Environment Variables

The following environment variables are used:

- `APP_ENV`: The environment to run the bot in (`dev` or `prod`).
- `BOT_TOKEN_DEV`: The Discord bot token for the development environment.
- `BOT_TOKEN_PROD`: The Discord bot token for the production environment.
- `BOT_CLIENT_ID_DEV`: The Discord client ID for the development environment.
- `BOT_CLIENT_ID_PROD`: The Discord client ID for the production environment.
- `GOOGLE_KEY`: The Google API key for YouTube API access.
- `DEPLOY`: Whether to deploy commands on startup (`true` or `false`).
- `TEST_WICHTELN`: Whether to use the wichtel command in prod or in save dev mode (wichtel channel or dm) (`true` or `false`).
- `GIF_CREATOR`: The link to the image server, that creates GIFs for teh random user command.
- `LAVALINK_HOST`: The hostname of the Lavalink server.
- `LAVALINK_PORT`: The port of the Lavalink server.
- `LAVALINK_PW`: The password for the Lavalink server.
- `LAVALINK_SECURE`: Whether to use a secure connection to the Lavalink server (`true` or `false`).
- `LOG_LEVEL`: The level which log messages should be printed (`DEBUG | INFO | WARN | ERROR`).
- `ENABLE_ALERT`: Whether the admin user should receive alerts from errors (`true` or `false`).
- `DB_HOST`: The hostname of the database server.
- `DB_USER`: The username for the database connection.
- `DB_PASSWORD`: The password for the database connection.

## Configuration Files

The configuration is loaded using the `config` npm package, which automatically loads configuration files from the `config` directory. The default configuration file is `default.json`.

Environment-specific configuration files can be created by naming them `{environment}.json`, where `{environment}` is the value of the `NODE_ENV` environment variable. For example, `development.json` or `production.json`.

## Usage

The configuration can be accessed using the `config` module:

```javascript
const config = require('./util/config');

// Get a Discord-related configuration value
const guildId = config.getGuildId();

// Get an environment variable
const googleKey = config.getEnv('GOOGLE_KEY');
```

See the `src/util/config.js` file for all available methods.
