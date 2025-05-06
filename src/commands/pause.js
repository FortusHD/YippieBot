// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Pauses (or resumes) the current song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausiert oder startet den Bot wieder'),
    async execute(interaction) {
        logger.info(`Handling pause command used by "${interaction.user.tag}".`);

        const client = interaction.client;
        const player = client.riffy.players.get(interaction.guildId);

        if (player.current) {
            if (player.paused) {
                logger.info('Bot was resumed.');
                await interaction.reply('Der Bot spielt jetzt weiter.');
            } else {
                logger.info('Bot was paused.');
                await interaction.reply('Der Bot wurde pausiert.');
            }

            player.pause(!player.paused);
        } else {
            logger.info('Nothing playing right now.');
            await interaction.reply('Gerade spielt doch gar nichts.');
        }
    },
};