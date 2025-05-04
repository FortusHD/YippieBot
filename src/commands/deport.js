// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const { getAfkChannelId } = require('../util/config');
const { withErrorHandling, ErrorType, handleError } = require('../logging/errorHandler');

// Moves a user into the AFK-Channel and adds them to the prisoner list
module.exports = {
    guild: true,
    dm: false,
    data: new SlashCommandBuilder()
        .setName('deport')
        .setDescription('Hiermit wird ein User nach AFK deportiert')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User, der deportiert werden soll')
                .setRequired(true)),
    execute: withErrorHandling(async function (interaction) {
        logger.info(`Handling deport command used by "${interaction.user.tag}".`);

        const user = interaction.options.getUser('user');
        const guild = interaction.guild;

        const afkChannel = guild.channels.cache
            .find(channel => channel.id === getAfkChannelId());

        if (!afkChannel) {
            handleError(`The afk channel with id ${getAfkChannelId()} could not be found`, __filename, {
                type: ErrorType.RESOURCE_NOT_FOUND,
                interaction,
                context: { command: 'deport', afkChannelId: getAfkChannelId() },
            });
            return;
        }

        const member = guild.members.cache.get(user.id);
        if (!member) {
            handleError(`Invalid user specified: ${user.tag}`, __filename, {
                type: ErrorType.INVALID_INPUT,
                interaction,
                context: { command: 'deport', userId: user.id },
            });
            return;
        }

        // Add user to the prisoner list
        if (!data.isPrisoner(member.id)) {
            data.addPrisoner(member.id);
        }

        // Move user to AFK-Channel
        if (member.voice.channel) {
            try {
                await member.voice.setChannel(afkChannel);
            } catch (error) {
                handleError(`Failed to move user to AFK channel: ${error.message}`, __filename, {
                    type: ErrorType.DISCORD_API_ERROR,
                    interaction,
                    context: { command: 'deport', userId: member.id, afkChannelId: afkChannel.id },
                });
                return;
            }
        }

        logger.info(`${user.tag} was deported by "${interaction.user.tag}".`);
        await interaction.reply(`${user.tag} wurde deportiert!`);
    }, __filename),
};
