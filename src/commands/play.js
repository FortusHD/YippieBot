// Imports
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const {
    getPlaylist,
    editInteractionReply,
    formatDuration,
    buildEmbed,
    getOrCreatePlayer,
    validateUserInSameVoiceChannel,
} = require('../util/util');
const config = require('../util/config');

// Adds the given link to the song queue
module.exports = {
    guild: true,
    dm: false,
    vc: true,
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt ein Lied ab')
        .addStringOption(option =>
            option
                .setName('song')
                .setDescription('Der Song der abgespielt werden soll')
                .setRequired(true))
        .addBooleanOption(option =>
            option
                .setName('shuffle')
                .setDescription('Soll die Playlist gemischt werden? (nur für Playlists)')
                .setRequired(false)),
    async execute(interaction) {
        logger.info(`Handling play command used by "${interaction.user.tag}".`);

        // Remove language from the link if needed to get an optimal solution
        const songString = interaction.options.getString('song')?.replace('intl-de/', '');

        const client = interaction.client;

        // Get or create a player for this guild
        const player = getOrCreatePlayer(client, interaction);

        logger.debug(`Got following data: guild: ${interaction.guild.name}, `
            + `node: ${player?.node?.host}, query: ${songString}`, __filename);

        if (!player) {
            await interaction.reply({ content: config.getLavalinkNotConnectedMessage() });
            return;
        }

        // User needs to be in the same voice channel
        if (validateUserInSameVoiceChannel(interaction, player)) {
            if (songString) {
                await interaction.reply(`Suche "${songString}" ...`);

                const resolve = await client.riffy.resolve({ query: songString, requester: interaction.member });
                const { loadType, tracks, playlistInfo } = resolve;

                logger.debug(`result: loadType: ${loadType}, tracks: ${tracks?.length}, `);

                if (loadType === 'playlist') {
                    // Get playlist ID if available
                    const playlistId = songString.includes('list=')
                        ? songString.split('list=')[1]?.split('&')[0]
                        : null;

                    // Prepare for adding tracks
                    let firstTrack = null;
                    let addedTracks = 0;
                    let failedTracks = 0;
                    const maxTracksToAdd = 500; // Limit to prevent performance issues

                    const shouldShuffle = interaction.options.getBoolean('shuffle') ?? false;

                    let tracksToAdd = [...tracks];

                    if (shouldShuffle) {
                        for (let i = tracksToAdd.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [tracksToAdd[i], tracksToAdd[j]] = [tracksToAdd[j], tracksToAdd[i]];
                        }
                        logger.info(`Shuffled playlist with ${tracksToAdd.length} tracks.`);
                    }

                    if (tracksToAdd.length > maxTracksToAdd) {
                        logger.warn(`Playlist has ${tracksToAdd.length} tracks, limiting to ${maxTracksToAdd}.`);
                        tracksToAdd = tracksToAdd.slice(0, maxTracksToAdd);
                    }

                    // Add tracks to the queue
                    for (const track of tracksToAdd) {
                        try {
                            track.info.requester = interaction.member;
                            logger.debug(`Adding track: ${track.info.title}, ${track.info.uri}`);
                            player.queue.add(track);
                            addedTracks++;

                            if (!firstTrack) {
                                firstTrack = track;
                            }
                        } catch (trackError) {
                            logger.warn(`Failed to add track to queue: ${trackError.message}`);
                            failedTracks++;
                        }
                    }

                    // Get playlist data from YouTube if available
                    let playlistData = null;
                    let playlistTitle = playlistInfo?.name || 'Playlist';
                    let playlistImage = firstTrack?.info?.uri || null;

                    logger.info(`Added ${addedTracks} songs from ${playlistTitle} playlist.`);

                    if (playlistId) {
                        try {
                            playlistData = await getPlaylist(playlistId);
                            if (playlistData?.items?.[0]?.snippet) {
                                playlistTitle = playlistData.items[0].snippet.localized?.title
                                    || playlistTitle;
                                playlistImage = playlistData.items[0].snippet.thumbnails?.standard?.url
                                    || playlistImage;
                            }
                        } catch (playlistError) {
                            logger.warn(`Failed to fetch playlist data: ${playlistError.message}`);
                        }
                    }

                    logger.info(`"${interaction.user.tag}" added the playlist "${playlistTitle}" to the queue.`);

                    // Create a status message
                    let statusText = '';
                    if (failedTracks > 0) {
                        statusText = `\n\n${addedTracks} Songs hinzugefügt, ${failedTracks} fehlgeschlagen.`;
                    }

                    if (tracksToAdd.length === maxTracksToAdd && tracks.length > maxTracksToAdd) {
                        statusText += `\n\nHinweis: Die Playlist wurde auf ${maxTracksToAdd} Songs begrenzt.`;
                    }

                    if (shouldShuffle) {
                        statusText += '\n\nDie Playlist wurde gemischt.';
                    }

                    const songEmbed = buildEmbed({
                        color: 0x000aff,
                        title: config.getPlaylistAddedTitle(),
                        description: `<@${interaction.member.id}> hat die Playlist `
                            + `**${playlistTitle}** zur Queue hinzugefügt.${statusText}`,
                        origin: this.data.name,
                        image: playlistImage,
                    });

                    const openButton = new ButtonBuilder()
                        .setLabel('Öffnen')
                        .setStyle(ButtonStyle.Link)
                        .setURL(songString);

                    logger.info(`Added ${addedTracks} songs from ${playlistTitle} playlist.`);

                    await editInteractionReply(interaction, {
                        content: '',
                        embeds: [songEmbed],
                        components: [new ActionRowBuilder().addComponents(openButton)],
                    });

                    if (!player.playing && !player.paused) {
                        logger.debug('Starting player', __filename);
                        return player.play();
                    }
                } else if (loadType === 'search' || loadType === 'track') {
                    const track = tracks.shift();
                    track.info.requester = interaction.member;

                    logger.debug(`adding track: ${track.info.title}, ${track.info.uri}`);
                    player.queue.add(track);

                    const song = {
                        name: track?.info?.title ?? 'Unbekannter Name',
                        formattedDuration: formatDuration((track?.info?.length ?? 0) / 1000),
                        url: loadType === 'track' ? songString : track?.info?.uri ?? '',
                        thumbnail: track?.info?.thumbnail,
                    };

                    logger.info(`${interaction.user.tag} added the song "${song.name}" to the queue.`);

                    const songEmbed = buildEmbed({
                        color: 0x000aff,
                        title: config.getSongAddedTitle(),
                        description: `<@${interaction.member.id}> hat `
							+ `**${song.name}** \`${song.formattedDuration}\` zur Queue hinzugefügt.`,
                        origin: this.data.name,
                        image: song.thumbnail,
                    });

                    let openButton = null;
                    if (song.url !== '') {
                        openButton = new ButtonBuilder()
                            .setLabel('Öffnen')
                            .setStyle(ButtonStyle.Link)
                            .setURL(song.url);
                    }

                    await editInteractionReply(interaction, {
                        content: '',
                        embeds: [songEmbed],
                        components: openButton ? [new ActionRowBuilder().addComponents(openButton)] : null,
                    });

                    if (!player.playing && !player.paused) {
                        logger.debug('Starting player', __filename);
                        player.play();
                    }
                } else {
                    logger.info(`Could not find result for given query: ${songString}`);
                    await editInteractionReply(
                        interaction,
                        'Es konnte leider kein Song für deine Anfrage gefunden werden!',
                    );
                }
            } else {
                logger.info(`"${interaction.user.tag}" didn't specify a song when using the play command.`);
                await editInteractionReply(interaction, {
                    content: 'Bitte gib einen Link oder Text für den Song an!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } else {
            logger.info(`Bot is not in same channel as "${interaction.user.tag}"`);
            interaction.reply({
                content: 'Der Bot wird in einem anderen Channel verwendet!',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
