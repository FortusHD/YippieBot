const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SearchResultType } = require('distube');
const logger = require('../logging/logger.js');

const youTubeRegex = '^(https?://)?(www\\.youtube\\.com|youtu\\.be)/.+$';

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

		const voiceChannel = interaction.member.voice.channel;
		const songString = interaction.options.getString('song');

		if (voiceChannel) {
			let ownVoiceId = interaction.client.distube.voices.get(interaction.guild) ? interaction.client.distube.voices.get(interaction.guild).channelId : '';
			if (ownVoiceId === '') {
				logger.info(`Joining ${voiceChannel.name}.`);
				const distVoice = await interaction.client.distube.voices.join(voiceChannel);
				ownVoiceId = distVoice.channelId;
			}

			if (ownVoiceId === voiceChannel.id) {
				if (songString) {
					let song = null;

					if (songString.match(youTubeRegex) && songString.includes('&list=')) {
						logger.info(`${interaction.member.user.tag} added the playlist "${songString}" to the queue.`);

						await interaction.client.distube.play(voiceChannel, songString, { member: interaction.member });

						interaction.reply(`:notes: ${songString} wurde zur Queue hinzugefügt.`);
					} else {
						song = await interaction.client.distube.search(songString, { limit: 1, type: SearchResultType.VIDEO });

						const songEmbed = new EmbedBuilder()
							.setColor(0x000aff)
							.setTitle(`:musical_note: ${song[0].name}`)
							.setDescription(`<@${interaction.member.id}> hat **${song[0].name}** \`${song[0].formattedDuration}\` zur Queue hinzugefügt.`)
							.setThumbnail(song[0].thumbnail);

						logger.info(`${interaction.member.user.tag} added the song "${song[0].name}" to the queue.`);

						interaction.client.distube.play(voiceChannel, song[0].url, { member: interaction.member });

						interaction.reply({ embeds: [songEmbed] });
					}
				} else {
					logger.info(`${interaction.member.user.tag} didn't specify a song.`);
					interaction.reply({ content: 'Bitte gib einen Link oder Text für den Song an!', ephemeral: true });
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