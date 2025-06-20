/**
 * Play Command
 *
 * This command allows users to play music in a voice channel.
 * It supports:
 * - Individual tracks (via direct URL or search query)
 * - Playlists (with optional shuffling)
 *
 * The command handles various edge cases:
 * - Limiting large playlists to prevent performance issues
 * - Handling failed track additions
 * - Providing interactive buttons for music control
 * - Validating user and bot voice channel states
 */

// Import required Discord.js components
const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
} = require('discord.js');

// Import utility modules
const logger = require('../logging/logger.js');
const {
    getPlaylist, // Fetches playlist metadata from YouTube
    editInteractionReply, // Utility to edit interaction replies
    formatDuration, // Formats duration in milliseconds to readable format
    getOrCreatePlayer, // Gets or creates a music player for a guild
    validateUserInSameVoiceChannel, // Validates user is in same voice channel as bot
} = require('../util/util');
const config = require('../util/config');

// Import button handlers for interactive controls
const pauseResumeButton = require('../buttons/pauseResumeButton.js');
const skipButton = require('../buttons/skipButton.js');
const viewQueueButton = require('../buttons/viewQueueButton.js');
const { buildEmbed } = require('../util/embedBuilder');

// Command definition
module.exports = {
    guild: true,
    dm: false,
    vc: true,
    help: {
        usage: '/play <song> [shuffle]',
        examples: '`/play song:tbs herr dokter` | '
            + '`/play song: https://www.youtube.com/watch?v=E1UYftehmgE shuffle: true`',
        notes: 'Fügt einen Song oder auch ein Playlist zur Queue hinzu. Unterstützt werden YouTube und Spotify. '
            + 'Mit der shuffle Option kannst du eine Playlist direkt beim hinzufügen mischen.',
    },
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
                    /**
                     * Playlist Handling Logic
                     *
                     * For playlists, we need to:
                     * 1. Extract the playlist ID (if it's a YouTube playlist)
                     * 2. Optionally shuffle the tracks
                     * 3. Limit the number of tracks to prevent performance issues
                     * 4. Add each track to the queue
                     * 5. Fetch additional playlist metadata if possible
                     * 6. Create a rich embed with playlist information
                     */

                    // Extract playlist ID from URL if it's a YouTube playlist
                    // This is used later to fetch additional playlist metadata
                    const playlistId = songString.includes('list=')
                        ? songString.split('list=')[1]?.split('&')[0]
                        : null;

                    // Initialize tracking variables
                    let firstTrack = null; // Used for thumbnail if playlist metadata can't be fetched
                    let addedTracks = 0; // Count of successfully added tracks
                    let failedTracks = 0; // Count of tracks that failed to add
                    const maxTracksToAdd = 500; // Safety limit to prevent performance issues with huge playlists

                    // Check if user requested shuffled playlist
                    const shouldShuffle = interaction.options.getBoolean('shuffle') ?? false;

                    // Create a copy of the track array to avoid modifying the original
                    let tracksToAdd = [...tracks];

                    // Shuffle the playlist if requested, using Fisher-Yates algorithm
                    if (shouldShuffle) {
                        for (let i = tracksToAdd.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [tracksToAdd[i], tracksToAdd[j]] = [tracksToAdd[j], tracksToAdd[i]];
                        }
                        logger.info(`Shuffled playlist with ${tracksToAdd.length} tracks.`);
                    }

                    // Limit the number of tracks to prevent performance issues
                    // This is important for very large playlists (e.g., "Liked Videos")
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

                    // Create buttons for music control
                    const openButton = new ButtonBuilder()
                        .setLabel('Öffnen')
                        .setStyle(ButtonStyle.Link)
                        .setURL(songString);

                    logger.info(`Added ${addedTracks} songs from ${playlistTitle} playlist.`);

                    // Create two rows of buttons for better organization
                    const linkRow = new ActionRowBuilder().addComponents(openButton);
                    const controlRow = new ActionRowBuilder().addComponents(
                        pauseResumeButton.data,
                        skipButton.data,
                        viewQueueButton.data,
                    );

                    await editInteractionReply(interaction, {
                        content: '',
                        embeds: [songEmbed],
                        components: [linkRow, controlRow],
                    });

                    if (!player.playing && !player.paused) {
                        logger.debug('Starting player', __filename);
                        return player.play();
                    }

                    if (player.paused) {
                        logger.debug('Resuming player', __filename);
                        player.pause(false);
                    }
                } else if (loadType === 'search' || loadType === 'track') {
                    /**
                     * Single Track Handling Logic
                     *
                     * For individual tracks (either direct URLs or search results), we:
                     * 1. Get the first track from result
                     * 2. Add the requester information to the track
                     * 3. Add the track to the queue
                     * 4. Create a rich embed with track information
                     * 5. Add interactive buttons for music control
                     */

                    // Get the first track from the results
                    // For 'search', this is the top search result
                    // For 'track', this is the resolved track from the URL
                    const track = tracks.shift();

                    // Add requester information to track for display in queue
                    track.info.requester = interaction.member;

                    // Add the track to the player's queue
                    logger.debug(`adding track: ${track.info.title}, ${track.info.uri}`);
                    player.queue.add(track);

                    // Create a song object with formatted information for the embed
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

                    // Create buttons for music control
                    let openButton = null;
                    if (song.url !== '') {
                        openButton = new ButtonBuilder()
                            .setLabel('Öffnen')
                            .setStyle(ButtonStyle.Link)
                            .setURL(song.url);
                    }

                    const skipButton = new ButtonBuilder()
                        .setCustomId('skipsong')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Primary);

                    const pauseResumeButton = new ButtonBuilder()
                        .setCustomId('pauseresume')
                        .setLabel('Pause/Resume')
                        .setStyle(ButtonStyle.Success);

                    const viewQueueButton = new ButtonBuilder()
                        .setCustomId('viewqueue')
                        .setLabel('Queue anzeigen')
                        .setStyle(ButtonStyle.Secondary);

                    // Create button rows
                    const components = [];

                    if (openButton) {
                        components.push(new ActionRowBuilder().addComponents(openButton));
                    }

                    components.push(new ActionRowBuilder().addComponents(
                        pauseResumeButton,
                        skipButton,
                        viewQueueButton,
                    ));

                    await editInteractionReply(interaction, {
                        content: '',
                        embeds: [songEmbed],
                        components: components,
                    });

                    if (!player.playing && !player.paused) {
                        logger.debug('Starting player', __filename);
                        player.play();
                    }

                    if (player.paused) {
                        logger.debug('Resuming player', __filename);
                        player.pause(false);
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
