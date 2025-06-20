// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply, getTimeInSeconds } = require('../util/util');

// Seeks the current playing song for the given time
module.exports = {
    guild: true,
    dm: false,
    player: true,
    help: {
        usage: '/seek <time>',
        examples: '`/seek time:15` | `/seek time:01:00` | `/seek time:2:10`',
    },
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Springt zu einer bestimmten Stelle im aktuellen song')
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('Der Zeitpunkt im Song (mm:ss)')
                .setRequired(true),
        ),
    async execute(interaction) {
        logger.info(`Handling seek command used by "${interaction.user.tag}".`);

        const client = interaction.client;
        const time = interaction.options.getString('time');

        const timeRegex = '([0-9]?[0-9]:)?[0-5]?[0-9]:[0-5][0-9]';

        if (time.match(timeRegex)) {
            await interaction.reply(`Springe zu ${time}...`);
            const player = client.riffy.players.get(interaction.guildId);

            logger.debug(`Got following data: guild: ${interaction.guild.name}, `
                + `node: ${player.node.host}, query: ${time}`, __filename);

            const seconds = getTimeInSeconds(time);

            if (player.current) {
                player.seek(seconds * 1000);
                logger.info(`Seeked to ${time}`);
                await editInteractionReply(interaction, `Es wurde zu \`${time}\` gesprungen`);
            } else {
                logger.info('No song playing.');
                await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
            }
        } else {
            await interaction.reply('Bitte gebe eine gültige Zeit an!', { flags: MessageFlags.Ephemeral });
            logger.info(`"${interaction.user.tag}" entered an invalid time`);
        }
    },
};