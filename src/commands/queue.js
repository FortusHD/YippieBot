// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildQueueEmbed } = require('../util/musicUtil');
const { validateUserInSameVoiceChannel, formatDuration } = require('../util/util');
const { buildEmbed } = require('../util/embedBuilder');

/**
 * Handles the view interaction for displaying a specific queue page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object representing
 * the user's input.
 * @return {Promise<void>} A promise that resolves when the queue page has been successfully handled and displayed.
 */
async function handleView(interaction) {
    const page = interaction.options.getInteger('page');
    logger.debug(`Viewing queue page: ${page}`, __filename);
    await buildQueueEmbed(interaction, page);
}

/**
 * Handles the removal of a song from the queue based on the user's input.
 * Ensures that the user is in the same voice channel as the bot, validates
 * the position of the song in the queue, and removes the specified song.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object representing
 * the user's input.
 * @param {import('riffy').Player} player - The player instance handling the music queue and playback.
 * @return {Promise<void>} Resolves after the removal process is handled and a response is sent to the user.
 */
async function handleRemove(interaction, player) {
    if (!validateUserInSameVoiceChannel(interaction, player)) {
        await interaction.reply({
            content: 'Du musst im selben Sprachkanal wie der Bot sein, um Songs zu entfernen.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const position = interaction.options.getInteger('position');

    if (position <= 0 || position >= player.queue.size) {
        await interaction.reply({
            content: `Ungültige Position. Bitte wähle eine Zahl zwischen 1 und ${player.queue.size - 1}.`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const removedTrack = player.queue[position];
    player.queue.splice(position, 1);

    const removedEmbed = buildEmbed({
        color: 0x000aff,
        title: 'Song aus Queue entfernt',
        description: `<@${interaction.user.id}> hat **${removedTrack.info.title}** `
            + `\`${formatDuration(removedTrack.info.length / 1000)}\` aus der Queue entfernt.`,
        origin: 'queue',
    });

    logger.info(`"${removedTrack.info.title}" was removed from the queue by "${interaction.user.tag}".`);

    await interaction.reply({ embeds: [removedEmbed] });
}

/**
 * Clears the music queue of the player while retaining the currently playing track.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object representing
 * the user's input.
 * @param {import('riffy').Player} player - The player instance handling the music queue and playback.
 * @return {Promise<void>} Resolves once the action is complete and the user is notified.
 */
async function handleClear(interaction, player) {
    if (!validateUserInSameVoiceChannel(interaction, player)) {
        await interaction.reply({
            content: 'Du musst im selben Sprachkanal wie der Bot sein, um die Queue zu leeren.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Keep the currently playing song?
    const currentTrack = player.queue[0];
    player.queue.clear();

    // Add back the currently playing song?
    if (currentTrack) {
        player.queue.add(currentTrack);
    }

    const clearEmbed = buildEmbed({
        color: 0x000aff,
        title: 'Queue geleert',
        description: `<@${interaction.user.id}> hat die Queue geleert.`,
        origin: 'queue',
    });

    logger.info(`Queue was cleared by "${interaction.user.tag}".`);

    await interaction.reply({ embeds: [clearEmbed] });
}

// Advanced queue management
module.exports = {
    guild: true,
    dm: false,
    player: true,
    help: {
        usage: '/queue view [page] | /queue remove <position> | /queue clear',
        examples: '`/queue view` | `/queue view page:2` | `/queue remove position:3` | `/queue clear`',
        notes: 'Der User wird nach AFK verschoben und kann keine anderen Channel betreten, '
            + 'bis er mit `/permit` befreit wird.',
    },
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Verwaltet die Musik-Queue')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Zeigt dir die aktuelle Queue')
                .addIntegerOption(option =>
                    option
                        .setName('page')
                        .setDescription('Die Seite der Queue, die du sehen willst (25 Songs pro Seite)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Entfernt einen Song aus der Queue')
                .addIntegerOption(option =>
                    option
                        .setName('position')
                        .setDescription('Die Position des Songs in der Queue')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Leert die gesamte Queue')),
    async execute(interaction) {
        logger.info(`Handling queue command used by "${interaction.user.tag}".`);

        const player = interaction.client.riffy.players.get(interaction.guildId);

        if (!player) {
            await interaction.reply('Die Queue ist leer.');
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
        default:
        case 'view':
            await handleView(interaction);
            break;

        case 'remove':
            await handleRemove(interaction, player);
            break;

        case 'clear':
            await handleClear(interaction, player);
            break;
        }
    },
};
