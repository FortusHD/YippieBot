// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { skipSong } = require('../util/musicUtil');

// Skips the current playing song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den aktuellen Song'),
    async execute(interaction) {
        logger.info(`Handling skip command used by "${interaction.user.tag}".`);

        await skipSong(interaction);
    },
};