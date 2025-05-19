// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { extractQueuePage } = require('../util/util');
const { buildQueueEmbed } = require('../util/queueEmbedManager');
const logger = require('../logging/logger');

// Edits queue message embed to show next page of queue
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('nextpage')
        .setLabel('Nächste Seite')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling nextPage button pressed by "${interaction.user.tag}".`);

        const page = extractQueuePage(interaction.message.embeds[0]?.footer?.text);

        logger.debug(`Current page: ${page}`, __filename);

        if (page) {
            await buildQueueEmbed(interaction, page + 1, true);
            await interaction.deferUpdate();
        } else {
            logger.warn('Failed to extract queue page number.');
        }

        logger.info(`Done handling nextPage button pressed by "${interaction.user.tag}".`);
    },
};