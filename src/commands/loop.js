// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

/**
 * Handles the loop functionality for a music player in a specific interaction.
 * Toggles loop settings based on the given type and updates the user interaction accordingly.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object
 * representing the user's command input.
 * @param {import('riffy').Player} player - The player object controlling music playback.
 * @param {string} type - The type of loop to set. Can be 'off', 'queue', or 'track'.
 * @return {Promise<void>} A promise that resolves once the loop setting and interaction are handled.
 */
async function handleLoop(interaction, player, type) {
    const currentLoop = player.loop;

    if (currentLoop === type || type === 'off') {
        player.setLoop('none');
        logger.info(`Loop was disabled by "${interaction.user.tag}".`);
        await interaction.reply('Der Loop wurde deaktiviert.');
    } else {
        player.setLoop(type);
        logger.info(`${type} loop was enabled by "${interaction.user.tag}".`);
        if (type === 'queue') {
            await interaction.reply('Die Queue loopt jetzt.');
        } else {
            await interaction.reply('Der aktuelle Song loopt jetzt.');
        }
    }
}

// Advanced loop management
module.exports = {
    guild: true,
    dm: false,
    player: true,
    help: {
        usage: '/loop song | /loop queue | /loop off',
        examples: '`/loop song` | `/loop queue` | `/loop off`',
        notes: '`/loop song` oder `/loop queue` können auch wieder den loop ausschalten, falls dieser gerade läuft',
    },
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Startet oder stoppt einen Loop für den Song oder die Queue')
        .addSubcommand(subcommand =>
            subcommand
                .setName('song')
                .setDescription('Startet oder stoppt einen Loop für den Song'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Startet oder stoppt einen Loop für die Queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('off')
                .setDescription('Stoppt den aktuellen Loop (Song oder Queue)')),
    async execute(interaction) {
        logger.info(`Handling loop command used by "${interaction.user.tag}".`);

        const player = interaction.client.riffy.players.get(interaction.guildId);

        if (!player || !player.current) {
            await interaction.reply('Gerade spielt nichts.');
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
        case 'song':
            await handleLoop(interaction, player, 'track');
            break;

        case 'queue':
            await handleLoop(interaction, player, 'queue');
            break;

        default:
        case 'off':
            await handleLoop(interaction, player, 'off');
            break;
        }
    },
};
