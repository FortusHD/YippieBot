// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const wichtelModal = require('../modals/wichtelModal.js');
const logger = require('../logging/logger.js');

// Starts the participating progress by showing a modal to enter the steam data
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('participate')
        .setLabel('Teilnehmen')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling participate button pressed by "${interaction.user.tag}".`);

        await interaction.showModal(wichtelModal.data);

        logger.info(`Done handling participate button pressed by "${interaction.user.tag}".`);
    },
};