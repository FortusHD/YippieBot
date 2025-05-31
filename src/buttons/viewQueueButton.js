// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger');
const { buildQueueEmbed } = require('../util/musicUtil');

// Button to view the current music queue
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('viewqueue')
        .setLabel('Queue')
        .setStyle(ButtonStyle.Secondary),
    async execute(interaction) {
        logger.info(`Handling viewQueue button pressed by "${interaction.user.tag}".`);

        await buildQueueEmbed(interaction);
    },
};