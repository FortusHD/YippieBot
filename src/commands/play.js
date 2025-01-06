// Imports
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { getPlaylist, editInteractionReply, formatDuration} = require('../util/util');

// Adds the given link to the song queue
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
		logger.info(`Handling play command used by "${interaction.user.tag}".`);

		// Remove language from the link if needed, to get an optimal solution
		const songString = interaction.options.getString('song').replace('intl-de/', '');

		const voiceChannel = interaction.member.voice.channel;

		if (voiceChannel) {
			let player = interaction.client.riffy.players.get(interaction.guild)

			if (player) {
				let ownVoiceId = player.voiceChannel;
				const queue = player.queue

				// Join the channel, if not in a channel, or idle at the moment
				if (ownVoiceId === '' || !queue || !queue.size || queue.size === 0) {
					logger.info(`Joining ${voiceChannel.name}.`);
					player = interaction.client.riffy.createConnection({
						guildId: interaction.guild.id,
						voiceChannel: interaction.member.voice.channel.id,
						textChannel: interaction.channel.id,
						deaf: true,
					}) // TODO: Check if player gets replaced here
				}
			} else {
				player = interaction.client.riffy.createConnection({
					guildId: interaction.guild.id,
					voiceChannel: interaction.member.voice.channel.id,
					textChannel: interaction.channel.id,
					deaf: true,
				})
			}

			// User needs to be in the same voice channel
			if (player.voiceChannel === voiceChannel.id.toString()) {
				if (songString) {
					interaction.reply(`Suche "${songString}" ...`);

					const resolve = await interaction.client.riffy.resolve({ query: songString, requester: interaction.member });
					const { loadType, tracks, playlistInfo } = resolve;

					let songEmbed = null;
					let openButton = null;

					if (loadType === 'playlist') {
						for (const track of tracks) {
							track.info.requester = interaction.member;
							player.queue.add(track);
						}

						const title = (await getPlaylist(
							songString.split('list=')[1]))?.items[0]?.snippet?.localized?.title ?? 'Unbekannter Title';

						logger.info(`${interaction.member.user.tag} added the playlist "${songString}" to the queue.`);

						songEmbed = new EmbedBuilder()
							.setColor(0x000aff)
							.setTitle(':notes: Playlist wurde zur Queue hinzugefügt.')
							.setDescription(`<@${interaction.member.id}> hat die Playlist **${title}** zur Queue hinzugefügt.`)
							.setImage(/*TODO: Thumbnail of first track or playlist thumbnail*/);
						openButton = new ButtonBuilder()
							.setLabel('Öffnen')
							.setStyle(ButtonStyle.Link)
							.setURL(songString);

						await interaction.reply(`Added ${tracks.length} songs from ${playlistInfo.name} playlist.`);

						if (!player.playing && !player.paused) return player.play();
					} else if (loadType === 'search' || loadType === 'track') {
						const track = tracks.shift();
						track.info.requester = interaction.member;

						player.queue.add(track);

						const song = {
							name: track?.info?.title ?? 'Unbekannter Name',
							formattedDuration: formatDuration((track?.info?.length ?? 0) / 1000),
							url: songString,
							thumbnail: track?.info?.thumbnail
						};

						logger.info(`${interaction.member.user.tag} added the song "${song.name}" to the queue.`);

						songEmbed = new EmbedBuilder()
							.setColor(0x000aff)
							.setTitle(':musical_note: Song wurde zur Queue hinzugefügt.')
							.setDescription(`<@${interaction.member.id}> hat **${song.name}** \`${song.formattedDuration}\` zur Queue hinzugefügt.`)
							.setImage(song.thumbnail);
						openButton = new ButtonBuilder()
							.setLabel('Öffnen')
							.setStyle(ButtonStyle.Link)
							.setURL(song.url);

						if (!player.playing && !player.paused) return player.play();
					} else {
						return editInteractionReply(interaction, 'Es konnte leider kein SOng für deine Anfrage gefunden werden');
					}

					if (songEmbed && openButton) {
						await editInteractionReply(interaction, {
							content: '',
							embeds: [songEmbed],
							components: [new ActionRowBuilder().addComponents(openButton)]
						});
					}
				} else {
					logger.info(`"${interaction.member.user.tag}" didn't specify a song when using the play command.`);
					await editInteractionReply(interaction, { content: 'Bitte gib einen Link oder Text für den Song an!', ephemeral: true, });
				}
			} else {
				logger.info(`Bot is not in same channel as "${interaction.member.user.tag}"`);
				interaction.reply({ content: 'Der Bot wird in einem anderen Channel verwendet!', ephemeral: true });
			}
		} else {
			logger.info(`"${interaction.member.user.tag}" was not in a voice channel.`);
			interaction.reply({ content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen', ephemeral: true });
		}
	},
};