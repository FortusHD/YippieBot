// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger');
const { pauseOrResumePlayer } = require('../util/musicUtil');

// Button to pause or resume the current song
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('pauseresume')
        .setLabel('Pause/Resume')
        .setStyle(ButtonStyle.Success),
    async execute(interaction) {
        logger.info(`Handling pauseResume button pressed by "${interaction.user.tag}".`);

        await pauseOrResumePlayer(interaction);
    },
};
