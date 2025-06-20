// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { pauseOrResumePlayer } = require('../util/musicUtil');

// Pauses (or resumes) the current song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    help: {
        usage: '/pause',
    },
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausiert oder startet den Bot wieder'),
    async execute(interaction) {
        logger.info(`Handling pause command used by "${interaction.user.tag}".`);

        await pauseOrResumePlayer(interaction);
    },
};