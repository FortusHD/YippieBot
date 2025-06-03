# Yippie-Bot User Guide

## Introduction

Yippie-Bot is a Discord bot designed for the Yippie server, providing various functionalities including music playback, moderation tools, and utility commands. This guide will help you understand how to use the bot effectively.

## Quick Start

1. Invite the bot to your server using the provided invite link
2. Ensure the bot has the necessary permissions (Administrator is recommended)
3. Use `/help` to see a list of available commands
4. Join a voice channel and use `/play <song>` to start playing music

## Commands

### Music Commands

| Command         | Description                                        | Usage                      | Example                                                                  |
|-----------------|----------------------------------------------------|----------------------------|--------------------------------------------------------------------------|
| `/play`         | Plays a song or adds it to the queue               | `/play <song name or URL>` | `/play despacito` or `/play https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| `/pause`        | Pauses the currently playing song                  | `/pause`                   | `/pause`                                                                 |
| `/skip`         | Skips the currently playing song                   | `/skip`                    | `/skip`                                                                  |
| `/queue view`   | Shows the current music queue                      | `/queue view [page]`       | `/queue view 2`                                                          |
| `/queue remove` | Removes a song from the queue                      | `/queue remove <position>` | `/queue remove 3`                                                        |
| `/queue clear`  | Clears the entire queue                            | `/queue clear`             | `/queue clear`                                                           |
| `/nowplaying`   | Shows information about the currently playing song | `/nowplaying`              | `/nowplaying`                                                            |
| `/seek`         | Seeks to a specific position in the current song   | `/seek <time>`             | `/seek 1:30`                                                             |
| `/shuffle`      | Shuffles the current queue                         | `/shuffle`                 | `/shuffle`                                                               |
| `/join`         | Makes the bot join your voice channel              | `/join`                    | `/join`                                                                  |
| `/disconnect`   | Disconnects the bot from the voice channel         | `/disconnect`              | `/disconnect`                                                            |

### Voice Channel Management Commands

| Command        | Description                                          | Usage                                       | Example                           |
|----------------|------------------------------------------------------|---------------------------------------------|-----------------------------------|
| `/deport`      | Moves users from one voice channel to another        | `/deport <source channel> <target channel>` | `/deport "General" "AFK"`         |
| `/quickdeport` | Quickly moves users to a predefined channel          | `/quickdeport <channel>`                    | `/quickdeport "AFK"`              |
| `/permit`      | Grants permission for a user to join a voice channel | `/permit <user> <channel>`                  | `/permit @User "Private Channel"` |

### Utility Commands

| Command       | Description                                        | Usage                        | Example                                        |
|---------------|----------------------------------------------------|------------------------------|------------------------------------------------|
| `/teams`      | Creates random teams from users in a voice channel | `/teams <number of teams>`   | `/teams 2`                                     |
| `/random`     | Generates a random number                          | `/random <min> <max>`        | `/random 1 100`                                |
| `/randomuser` | Selects random users from a voice channel          | `/randomuser <count>`        | `/randomuser 3`                                |
| `/poll`       | Creates a poll                                     | `/poll <question> <options>` | `/poll "Favorite color?" "Red" "Blue" "Green"` |
| `/rolldice`   | Rolls dice with various options                    | `/rolldice <dice notation>`  | `/rolldice 2d6+3`                              |
| `/rollhelp`   | Shows help for dice rolling                        | `/rollhelp`                  | `/rollhelp`                                    |

### Wichteln (Secret Santa) Commands

| Command        | Description             | Usage          | Example        |
|----------------|-------------------------|----------------|----------------|
| `/wichteln`    | Starts a Wichteln event | `/wichteln`    | `/wichteln`    |
| `/endwichteln` | Ends a Wichteln event   | `/endwichteln` | `/endwichteln` |

## Interactive Buttons

Yippie-Bot provides interactive buttons for easier interaction:

- **Pause/Resume Button**: Toggle between pausing and resuming the current song
- **Skip Button**: Skip the current song
- **View Queue Button**: View the current music queue
- **Queue Navigation Buttons**: Navigate through pages of the queue
- **Reshuffle Teams Button**: Reshuffle teams after using the teams command
- **Participate Button**: Join an activity
- **Participants Button**: View participants in an activity

## Examples and Use Cases

### Setting Up Music for a Party

1. Join a voice channel
2. Use `/play party playlist` to start playing a party playlist
3. Use the pause/resume button to control playback
4. Use `/queue view` to see what's coming up
5. Use `/queue remove` to remove songs you don't want
6. Use `/shuffle` to mix up the order

### Creating Teams for a Game

1. Make sure all players are in a voice channel
2. Use `/teams 2` to split into two teams
3. If you're not happy with the teams, use the Reshuffle Teams button
4. Use `/deport "Team 1" "Team 1 Channel"` to move players to their team channels

### Running a Poll

1. Use `/poll "What should we play next?" "Game 1" "Game 2" "Game 3"` to create a poll
2. Let users vote by clicking on the reaction emojis
3. After voting is complete, the results will be displayed

## Troubleshooting

- **Bot not responding**: Make sure the bot is online and has the necessary permissions
- **Music not playing**: Ensure you're in a voice channel and the bot has permission to join
- **Commands not working**: Check that you're using the correct command syntax

## Getting Help

If you encounter any issues or have questions about using Yippie-Bot, you can:
- Use `/help` for a list of commands
- Contact the bot administrator
- Check the [GitHub repository](https://github.com/yourusername/yippie-bot) for updates and issues