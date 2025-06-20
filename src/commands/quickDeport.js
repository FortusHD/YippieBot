// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { getAfkChannelId } = require('../util/config');
const { withErrorHandling, ErrorType, handleError } = require('../logging/errorHandler');

// Moves a user to the AFK-Channel
module.exports = {
    guild: true,
    dm: false,
    help: {
        usage: '/quick-deport <user>',
        examples: '`/quick-deport user:@Bot-ler#3822`',
        notes: 'Der User wird nur nach AFK verschoben und kann danach wieder anderen Channel betreten.',
    },
    data: new SlashCommandBuilder()
        .setName('quick-deport')
        .setDescription('Hiermit wird ein User nach AFK verschoben')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User, der verschoben werden soll')
                .setRequired(true)),
    execute: withErrorHandling(async function (interaction) {
        logger.info(`Handling quickDeport command used by "${interaction.user.tag}".`);

        const user = interaction.options.getUser('user');
        const guild = interaction.guild;

        const afkChannel = guild.channels.cache
            .find(channel => channel.id === getAfkChannelId());

        logger.debug(`Got following data: user: ${ user.tag }, guild: ${guild.name}, `
            + `afkChannel: ${afkChannel ? afkChannel.name : 'NULL'}`, __filename);

        if (!afkChannel) {
            handleError(`The afk channel with id ${getAfkChannelId()} could not be found`, __filename, {
                type: ErrorType.RESOURCE_NOT_FOUND,
                interaction,
                context: { command: 'quick-deport', afkChannelId: getAfkChannelId() },
            });
            return;
        }

        const member = guild.members.cache.get(user.id);
        if (!member) {
            handleError(`Invalid user specified: ${user.tag}`, __filename, {
                type: ErrorType.INVALID_INPUT,
                interaction,
                context: { command: 'quick-deport', userId: user.id },
            });
            return;
        }

        if (member.voice.channel) {
            try {
                await member.voice.setChannel(afkChannel);
            } catch (error) {
                handleError(`Failed to move user to AFK channel: ${error.message}`, __filename, {
                    type: ErrorType.DISCORD_API_ERROR,
                    interaction,
                    context: { command: 'quick-deport', userId: user.id, afkChannelId: afkChannel.id },
                });
                return;
            }
        }

        logger.info(`"${member.user.tag}" was moved by "${interaction.user.tag}".`);
        await interaction.reply(`${member.user.tag} wurde verschoben!`);
    }, __filename),
};
