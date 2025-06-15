const logger = require('../logging/logger');
const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { validateUserInSameVoiceChannel, formatDuration, buildEmbed, editInteractionReply } = require('./util');

/**
 * Toggles the playback state of the bot, pausing or resuming the current track if available.
 *
 * @param {import(discord.js).Interaction} interaction - The interaction object
 * containing details about the Discord event.
 * @return {Promise<void>} A Promise that resolves when the interaction response is sent and playback state is toggled.
 */
async function pauseOrResumePlayer(interaction) {
    const player = interaction.client.riffy.players.get(interaction.guildId);

    logger.debug(`Got following data: guild: ${interaction.guild.name}, `
        + `node: ${player?.node?.host}`, __filename);

    if (!player || !player.current) {
        await interaction.reply({
            content: 'Es wird derzeit kein Song abgespielt.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (!validateUserInSameVoiceChannel(interaction, player)) {
        await interaction.reply({
            content: 'Du musst im selben Sprachkanal wie der Bot sein, um die Wiedergabe zu steuern.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (player.paused) {
        player.pause(false);
        await interaction.reply({
            content: `${interaction.user} hat die Wiedergabe fortgesetzt.`,
        });
        logger.info(`"${interaction.user.tag}" resumed playback using the pause/resume button.`);
    } else {
        player.pause(true);
        await interaction.reply({
            content: `${interaction.user} hat die Wiedergabe pausiert.`,
        });
        logger.info(`"${interaction.user.tag}" paused playback using the pause/resume button.`);
    }
}

/**
 * Skips the currently playing song in the music player and optionally moves to the next song in the queue.
 * If no song is currently playing, notifies the user.
 *
 * @param {import(discord.js).Interaction} interaction - The interaction instance that contains relevant client
 * and guild information.
 * @return {Promise<void>} A promise that resolves after the action is completed,
 * including sending the notification embed to the user.
 */
async function skipSong(interaction) {
    await interaction.reply('Überspringe...');

    const player = interaction.client.riffy.players.get(interaction.guildId);

    logger.debug(`Got following data: guild: ${interaction.guild.name}, `
        + `node: ${player?.node?.host}`, __filename);

    if (!player.current) {
        logger.info('No song playing.');
        await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
        return;
    }

    const skippedSong = player.current;
    const newSong = player.queue ? player.queue.first : null;

    await player.stop();

    logger.info(`${skippedSong.info.title} skipped! ${newSong
        ? `Now playing: ${newSong.info.title}.`
        : 'Queue is empty.'}`);
    const skipEmbed = buildEmbed({
        color: 0x000aff,
        title: `:fast_forward: ${skippedSong.info.title} übersprungen`,
        description: `**${skippedSong.info.title}** wurde übersprungen!\n${newSong
            ? `Jetzt läuft: **${newSong.info.title}**`
            : 'Die Warteschlange ist jetzt leer.'}`,
        origin: 'skip',
    });
    await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] });
}

/**
 * Builds and displays an embed for the music queue, including pagination and editable options.
 *
 * @param {import(discord.js).Interaction} interaction - The interaction object from the Discord API,
 * used for context and client access.
 * @param {number} page - The requested page number of the queue embed to display.
 * @param {boolean} [edit=false] - Whether to edit an existing message or send a new reply.
 * @return {Promise<void>} Resolves when the embed has been successfully sent or edited.
 */
async function buildQueueEmbed(interaction, page, edit = false) {
    const player = interaction.client.riffy.players.get(interaction.guildId);
    const queue = player?.queue;

    if (!queue || queue.size <= 0) {
        logger.info('Queue was empty.');
        if (edit) {
            await interaction.message.edit({ content: 'Die Queue ist leer.', embeds: [], components: [] });
        } else {
            await interaction.reply('Die Queue ist leer.');
        }
        return;
    }

    const maxPage = Math.floor(queue.size / 25 + 1);

    // Make sure the page is inside bounds
    if (!page || page <= 0) {
        page = 1;
    }
    if (page > maxPage) {
        page = maxPage;
    }

    logger.info(`"${interaction.member.guild.tag}" requested page ${page} of the queue.`);

    let queueString = '';

    // Determine which song are on the requested page
    for (let i = (page - 1) * 25; i < page * 25; i++) {
        if (i >= queue.size) {
            break;
        }

        const song = queue[i];

        queueString += `**${i + 1}.** ${song.info.title} \`${formatDuration(song.info.length / 1000)}\` `
            + `- <@${song.info.requester.id}>\n`;
    }

    queueString = queueString.substring(0, queueString.length - 1);

    logger.debug(`Queue string: ${queueString}`, __filename);

    const queueEmbed = buildEmbed({
        color: 0x000aff,
        title: ':cd: Queue',
        description: queueString,
        origin: 'queue',
        footer: { text: ` • Seite ${page}/${maxPage}` },
    });

    const queueButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previouspage')
                .setLabel('Vorherige Seite')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('nextpage')
                .setLabel('Nächste Seite')
                .setStyle(ButtonStyle.Primary),
        );

    logger.info('Sending queue embed.');

    if (edit) {
        await interaction.message.edit({ embeds: [queueEmbed], components: [queueButtons] });
    } else {
        await interaction.reply({ embeds: [queueEmbed], components: [queueButtons] });
    }
}

module.exports = { pauseOrResumePlayer, skipSong, buildQueueEmbed };