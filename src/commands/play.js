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
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling play command used by "${interaction.user.tag}".`);

        // Remove language from the link if needed to get an optimal solution
        const songString = interaction.options.getString('song')?.replace('intl-de/', '');

        const client = interaction.client;

        // Get or create a player for this guild
        const player = getOrCreatePlayer(client, interaction);

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

                if (loadType === 'playlist') {
                    let firstTrack = null;
                    let firstTrackSet = false;

                    for (const track of tracks) {
                        track.info.requester = interaction.member;
                        player.queue.add(track);
                        if (!firstTrackSet) {
                            firstTrack = track;
                            firstTrackSet = true;
                        }
                    }

                    const playlistData = await getPlaylist(songString.split('list=')[1]);

                    logger.info(`"${interaction.user.tag}" added the playlist "${songString}" to the queue.`);

                    const songEmbed = buildEmbed({
                        color: 0x000aff,
                        title: config.getPlaylistAddedTitle(),
                        description: `<@${interaction.member.id}> hat die Playlist `
							+ `**${playlistData.items[0]?.snippet?.localized?.title ?? 'Unbekannter Title'}** `
							+ 'zur Queue hinzugefügt.',
                        origin: this.data.name,
                        image: playlistData.items[0]?.snippet?.thumbnails?.standard?.url ?? firstTrack.info.uri,
                    });
                    const openButton = new ButtonBuilder()
                        .setLabel('Öffnen')
                        .setStyle(ButtonStyle.Link)
                        .setURL(songString);

                    logger.info(`Added ${tracks.length} songs from ${playlistInfo.name} playlist.`);

                    await editInteractionReply(interaction, {
                        content: '',
                        embeds: [songEmbed],
                        components: [new ActionRowBuilder().addComponents(openButton)],
                    });

                    if (!player.playing && !player.paused) {
                        return player.play();
                    }
                } else if (loadType === 'search' || loadType === 'track') {
                    const track = tracks.shift();
                    track.info.requester = interaction.member;

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
