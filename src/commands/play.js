// Imports
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { getPlaylist } = require('../util/util');
const ytsr = require('@distube/ytsr');

// Adds the given link
module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Spielt ein Lied ab')
		.addStringOption(option =>
			option
				.setName('song')
				.setDescription('Der Song der abgespielt werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested the bot to play a song.`);

		const youTubeRegex = '^(https?://)?(www\\.youtube\\.com|youtu\\.be)/.+$';
		const spotifyRegex = '^(https://open.spotify.com/(track|album|playlist)/)([a-zA-Z0-9]+)(.*)$';
		const voiceChannel = interaction.member.voice.channel;
		const songString = interaction.options.getString('song').replace('intl-de/', '');

		if (voiceChannel) {
			let ownVoiceId = interaction.client.distube.voices.get(interaction.guild) ? interaction.client.distube.voices.get(interaction.guild).channelId : '';

			// Join channel, if not in channel
			if (ownVoiceId === '') {
				logger.info(`Joining ${voiceChannel.name}.`);
				const distVoice = await interaction.client.distube.voices.join(voiceChannel);
				ownVoiceId = distVoice.channelId;
			}

			if (ownVoiceId === voiceChannel.id.toString()) {
				if (songString) {
					interaction.reply(`Suche "${songString}" ...`);

					let songEmbed = null;
					let openButton = null;

					if (songString.match(youTubeRegex) && songString.includes('playlist?')) {
						// Link leads to playlist
						const queueLength = interaction.client.distube.getQueue(interaction.guild)?.songs?.length ?? 0;
						await interaction.client.distube.play(voiceChannel, songString, { member: interaction.member });
						const title = (await getPlaylist(songString.split('list=')[1]))?.items[0]?.snippet?.localized?.title ?? 'Unbekannter Title';

						logger.info(`${interaction.member.user.tag} added the playlist "${songString}" to the queue.`);

						songEmbed = new EmbedBuilder()
							.setColor(0x000aff)
							.setTitle(':notes: Playlist wurde zur Queue hinzugefügt.')
							.setDescription(`<@${interaction.member.id}> hat die Playlist **${title}** zur Queue hinzugefügt.`)
							.setImage(interaction.client.distube.getQueue(interaction.guild)?.songs[queueLength]?.thumbnail);
						openButton = new ButtonBuilder()
							.setLabel('Öffnen')
							.setStyle(ButtonStyle.Link)
							.setURL(songString);
					} else if (songString.match(youTubeRegex) || songString.match(spotifyRegex)) {
						//Link leads to single song or spotify song
						const queueLength = interaction.client.distube.getQueue(interaction.guild)?.songs?.length ?? 0;
						await interaction.client.distube.play(voiceChannel, songString, { member: interaction.member });
						const song = await interaction.client.distube.getQueue(interaction.guild)?.songs[queueLength] ?? {
							name: 'Unbekannter Name',
							formattedDuration: '??:??',
							url: null,
							thumbnail: null
						};

						logger.info(`${interaction.member.user.tag} added the song "${song.name}" to the queue.`);

						if (songString.match(spotifyRegex)) {
							songEmbed = new EmbedBuilder()
								.setColor(0x000aff)
								.setTitle(':notes: Spotify-Link wurde zur Queue hinzugefügt.')
								.setDescription(`<@${interaction.member.id}> hat **${song.name}** \`${checkSpotifyDuration(song)}\` zur Queue hinzugefügt.`)
								.setImage(song.thumbnail);
							openButton = new ButtonBuilder()
								.setLabel('Öffnen')
								.setStyle(ButtonStyle.Link)
								.setURL(song.url);
						} else {
							songEmbed = buildYoutubeSongEmbed(interaction, song);
							openButton = buildYoutubeOpenButton(song);
						}
					} else {
						// No link -> Search
						const youtubeSong = (await ytsr(songString, { safeSearch: true, limit: 1 })).items[0];

						logger.info(`${interaction.member.user.tag} added the song "${youtubeSong.name}" to the queue.`);

						await interaction.client.distube.play(voiceChannel, youtubeSong.url, { member: interaction.member });

						songEmbed = new EmbedBuilder()
							.setColor(0x000aff)
							.setTitle(':musical_note: Song wurde zur Queue hinzugefügt.')
							.setDescription(`<@${interaction.member.id}> hat **${youtubeSong.name}** \`${youtubeSong.duration}\` zur Queue hinzugefügt.`)
							.setImage(youtubeSong.thumbnail);
						openButton = buildYoutubeOpenButton(youtubeSong);
					}

					await interaction.editReply({
						content: '',
						embeds: [songEmbed],
						components: [new ActionRowBuilder().addComponents(openButton)]
					});
				} else {
					logger.info(`${interaction.member.user.tag} didn't specify a song.`);
					await interaction.editReply({
						content: 'Bitte gib einen Link oder Text für den Song an!',
						ephemeral: true,
					});
				}
			} else {
				logger.info(`Bot is not in same channel as ${interaction.member.user.tag}`);
				interaction.reply({ content: 'Der Bot wird in einem anderen Channel verwendet!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} was not in a voice channel.`);
			interaction.reply({ content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen', ephemeral: true });
		}
	},
};

function buildYoutubeSongEmbed(interaction, youtubeSong) {
	return new EmbedBuilder()
		.setColor(0x000aff)
		.setTitle(':musical_note: Song wurde zur Queue hinzugefügt.')
		.setDescription(`<@${interaction.member.id}> hat **${youtubeSong.name}** \`${youtubeSong.formattedDuration}\` zur Queue hinzugefügt.`)
		.setImage(youtubeSong.thumbnail);
}

function buildYoutubeOpenButton(youtubeSong) {
	return new ButtonBuilder()
		.setLabel('Öffnen')
		.setStyle(ButtonStyle.Link)
		.setURL(youtubeSong.url);
}

function checkSpotifyDuration(spotifySong) {
	if (!spotifySong) {
		logger.warn('Spotify song was null');
		return '??:??';
	}
	if (!spotifySong.formattedDuration || spotifySong.formattedDuration === '00:00') {
		if (!spotifySong.stream || !spotifySong.stream.song) {
			logger.warn('Spotify song sub-object could not be found');
			return '??:??';
		}
		return spotifySong.stream.song.formattedDuration ? spotifySong.stream.song.formattedDuration : '??:??';
	} else {
		return spotifySong.formattedDuration;
	}
}