// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildQueueEmbed } = require('../util/queueEmbedManager');

// Displays the current queue
module.exports = {
    guild: true,
    dm: false,
    player: true,
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Zeigt dir die aktuelle Queue')
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Die Seite der Queue, die du sehen willst (25 Songs pro Seite)')
                .setRequired(false)),
    async execute(interaction) {
        logger.info(`Handling queue command used by "${interaction.user.tag}".`);

        const page = interaction.options.getInteger('page');

        await buildQueueEmbed(interaction, page);
    },
};