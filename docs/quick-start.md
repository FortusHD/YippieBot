# Yippie-Bot Quick Start Guide

This guide will help you quickly get started with Yippie-Bot on your Discord server.

## Setup

1. **Invite the Bot**: Use the provided invite link to add Yippie-Bot to your server.

2. **Permissions**: Ensure the bot has the necessary permissions:
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use External Emojis
   - Connect to Voice Channels
   - Speak in Voice Channels
   - Move Members (for deport commands)

3. **Configuration**: No additional configuration is needed to start using the bot.

## Essential Commands

### Music Commands

- **Play Music**: 
  ```
  /play <song name or URL>
  ```
  Join a voice channel first, then use this command to play music.

- **Control Playback**:
  ```
  /pause    - Pause the current song
  /skip     - Skip to the next song
  /queue view - View the current queue
  ```

- **End Music Session**:
  ```
  /disconnect
  ```
  Disconnects the bot from the voice channel.

### Utility Commands

- **Create Teams**:
  ```
  /teams <number of teams>
  ```
  Randomly assigns users in your voice channel to teams.

- **Create a Poll**:
  ```
  /poll "Question?" "Option 1" "Option 2" "Option 3"
  ```
  Creates a poll with reaction voting.

- **Roll Dice**:
  ```
  /rolldice 2d6+3
  ```
  Rolls two six-sided dice and adds 3 to the result.

## Interactive Buttons

After using certain commands, you'll see buttons that allow for easier interaction:

- **Music Controls**: Pause/Resume, Skip, View Queue
- **Team Controls**: Reshuffle Teams
- **Queue Navigation**: Previous Page, Next Page

## Common Use Cases

### Music for a Discord Hangout

1. Join a voice channel
2. Type `/play <your favorite song>`
3. Use the buttons to control playback
4. Add more songs with `/play`
5. View the queue with `/queue view`

### Gaming Session Team Setup

1. Get everyone in a voice channel
2. Type `/teams 2` to create two balanced teams
3. Use the Reshuffle button if you want different teams
4. Use `/deport "Team 1" "Team 1 Channel"` to move players to their team channels

## Getting Help

If you need more information:
- Check the full [User Guide](user-guide.md)
- Use `/help` for a list of commands (if implemented)
- Contact the server administrator

## Troubleshooting

- **Bot not responding**: Make sure the bot is online and has the necessary permissions
- **Can't hear music**: Ensure you're in the same voice channel as the bot
- **Commands not working**: Check that you're using the correct command syntax with the `/` prefix