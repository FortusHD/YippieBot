// Imports
const { Events, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { notifyAdminCookies } = require('../util/util');
const { getAdminUserId } = require('../util/config');
const { handleError, ErrorType } = require('../logging/errorHandler');

// Handles all user interaction (command, button and modal submission)
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        logger.debug(`Received interaction ${interaction.id} of type ${interaction.type}.`, __filename);

        if (interaction.isChatInputCommand()) {
            // Commands
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                handleError(`No command matching ${interaction.commandName} was found.`, __filename, {
                    type: ErrorType.UNKNOWN_COMMAND,
                    interaction,
                    context: { command: interaction.commandName, user: interaction.user.id },
                });
                return;
            }

            logger.info(`"${interaction.user.tag}" used the ${interaction.commandName} command.`);

            const client = interaction.client;
            const player = interaction.guildId ? client.riffy.players.get(interaction.guildId) : null;

            try {
                if (!command.guild && interaction.guild !== null) {
                    await interaction.reply({
                        content: 'Dieser Befehl kann nicht auf einem Server verwendet werden.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (!command.dm && interaction.guild === null) {
                    await interaction.reply({
                        content: 'Dieser Befehl kann nur auf einem Server verwendet werden.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (command.player && player === null) {
                    await interaction.reply({
                        content: 'Der Bot ist nicht in einem VoiceChannel.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (command.devOnly && interaction.user.id !== getAdminUserId()) {
                    await interaction.reply({
                        content: 'Dazu hast du keine Berechtigung!',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (command.vc && interaction.member?.voice?.channel === null) {
                    await interaction.reply({
                        content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                await command.execute(interaction);
            } catch (error) {
                // Catch some common errors
                if (error.rawError && error.rawError.message === 'Unknown interaction') {
                    logger.warn('Interaction was not found (race-condition?), ignoring.');
                } else {
                    if (error.name === 'PlayError') {
                        // Cookies are needed for YouTube requests
                        handleError(error, __filename, {
                            type: ErrorType.PLAY_ERROR,
                            interaction,
                            context: { command: interaction.commandName, user: interaction.user.id },
                        });
                        await notifyAdminCookies(interaction);
                    } else if (error.name === 'InteractionNotReplied') {
                        // Sometimes an interaction cannot be replied to
                        handleError(error, __filename, {
                            type: ErrorType.INTERACTION_ERROR,
                            interaction,
                            context: { command: interaction.commandName, user: interaction.user.id },
                        });
                    } else {
                        handleError(error, __filename, {
                            type: ErrorType.UNKNOWN_ERROR,
                            interaction,
                            context: { command: interaction.commandName, user: interaction.user.id },
                        });
                    }
                }
            }
        } else if (interaction.isButton()) {
            // Buttons
            const button = interaction.client.buttons.get(interaction.customId);

            if (!button) {
                handleError(`No button matching ${interaction.commandName} was found.`, __filename, {
                    type: ErrorType.UNKNOWN_BUTTON,
                    interaction,
                    context: { button: interaction.customId, user: interaction.user.id },
                });
                return;
            }

            logger.info(`"${interaction.user.tag}" pressed the ${interaction.customId} button.`);

            try {
                await button.execute(interaction);
            } catch (error) {
                handleError(error, __filename, {
                    type: ErrorType.UNKNOWN_ERROR,
                    interaction,
                    context: { button: interaction.customId, user: interaction.user.id },
                });
            }
        } else if (interaction.isModalSubmit()) {
            // Modals
            const modal = interaction.client.modals.get(interaction.customId);

            if (!modal) {
                handleError(`No modal matching ${interaction.customId} was found.`, __filename, {
                    type: ErrorType.UNKNOWN_COMMAND,
                    interaction,
                    context: { modal: interaction.customId, user: interaction.user.id },
                });
                return;
            }

            logger.info(`"${interaction.user.tag}" submitted the ${interaction.customId} modal.`);

            try {
                await modal.execute(interaction);
            } catch (error) {
                handleError(error, __filename, {
                    type: ErrorType.UNKNOWN_ERROR,
                    interaction,
                    context: { modal: interaction.customId, user: interaction.user.id },
                });
            }
        }
    },
};