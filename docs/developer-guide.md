# Yippie-Bot Developer Guide

## Introduction

This guide is intended for developers who want to contribute to or modify the Yippie-Bot project. It provides information about the project's architecture, setup process, and contribution guidelines.

## Project Setup

### Prerequisites

- Node.js (v16.x or higher)
- npm (v7.x or higher)
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Lavalink server (for music functionality)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/yippie-bot.git
   cd yippie-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the bot:
   - Copy `.env.example` to `.env`
   - Fill in your Discord Bot Token and other required credentials
   - Configure Lavalink connection details

4. Start the bot in development mode:
   ```bash
   npm run quick-start
   ```

### Development Scripts

- `npm start` - Start the bot
- `npm run quick-start` - Start the bot with nodemon for auto-reloading
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run security:audit` - Check for dependency vulnerabilities
- `npm run security:audit:fix` - Fix vulnerabilities automatically

## Project Architecture

### Directory Structure

- `src/` - Source code
  - `buttons/` - Button interaction handlers
  - `commands/` - Command implementations
  - `database/` - Database implementation
    - `tables/` - Access to tables of the database
  - `events/` - Discord event handlers
  - `health/` - Health check functionality
  - `logging/` - Logging utilities
  - `main/` - Main application code
  - `modals/` - Modal dialog handlers
  - `riffy/` - Riffy-specific functionality
  - `threads/` - Thread management
  - `util/` - Utility functions
- `config/` - Configuration files
- `data/` - Data storage
- `docs/` - Documentation
- `logs/` - Log files
- `__tests__/` - Test files

### Key Components

#### Command System

Commands are implemented in the `src/commands/` directory. Each command is a separate file that exports an object with the following structure:

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description')
    .addStringOption(option => 
      option.setName('parameter')
      .setDescription('Parameter description')
      .setRequired(true)
    ),

  async execute(interaction) {
    // Command implementation
  }
};
```

#### Button System

Button interactions are handled in the `src/buttons/` directory. Each button handler is a separate file that exports an object with the following structure:

```javascript
module.exports = {
  customId: 'button-id',

  async execute(interaction) {
    // Button handler implementation
  }
};
```

#### Configuration System

The bot uses a centralized configuration system in `src/util/config.js`. This file loads configuration from environment variables and provides default values.

#### Music System

The music functionality is implemented using Lavalink and the `erela.js` library. The main components are:

- `src/util/musicUtil.js` - Utility functions for music playback
- `src/commands/play.js` - Command to play music
- `src/commands/queue.js` - Command to manage the queue

#### Logging System

The bot uses a custom logging system in `src/logging/logger.js` that supports different log levels and formats.

## Contribution Guidelines

### Code Style

This project uses ESLint to enforce a consistent code style. Before submitting a pull request, make sure your code passes the linting checks:

```bash
npm run lint
```

You can automatically fix many style issues with:

```bash
npm run lint:fix
```

### Pull Request Process

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Changes that do not affect the meaning of the code
- `refactor:` - Code changes that neither fix a bug nor add a feature
- `perf:` - Performance improvements
- `test:` - Adding or fixing tests
- `chore:` - Changes to the build process or auxiliary tools

### Testing

Write tests for new features and bug fixes. Run the test suite before submitting a pull request:

```bash
npm test
```

## Deployment

### Docker Deployment

The project includes a Dockerfile for containerized deployment:

1. Build the Docker image:
   ```bash
   npm run buildContainer
   ```
   or
   ```bash
   docker build -t yippie-bot .
   ```

2. Run the container:
   ```bash
   docker run -d --name yippie-bot --env-file .env yippie-bot
   ```

### Environment-Specific Configuration

The bot supports different configurations for development, testing, and production environments. Set the `NODE_ENV` environment variable to specify the environment:

- `NODE_ENV=development` - Development environment
- `NODE_ENV=test` - Testing environment
- `NODE_ENV=production` - Production environment

## Troubleshooting

### Common Issues

- **Lavalink connection issues**: Ensure Lavalink is running and the connection details in `.env` are correct
- **Discord API errors**: Check that your bot token is valid and the bot has the necessary permissions
- **Database errors**: Verify that the data directory is writable

### Debugging

Set the `LOG_LEVEL` environment variable to `DEBUG` for more detailed logs:

```
LOG_LEVEL=DEBUG
```

## Resources

- [Discord.js Documentation](https://discord.js.org/)
- [Erela.js Documentation](https://erelajs-docs.netlify.app/)
- [Lavalink Documentation](https://github.com/freyacodes/Lavalink/blob/master/README.md)
