// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger');
const { skipSong } = require('../util/musicUtil');

// Button to skip the current song
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('skipsong')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling skipSong button pressed by "${interaction.user.tag}".`);

        await skipSong(interaction);
    },
};
