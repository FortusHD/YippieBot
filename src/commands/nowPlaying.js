// Imports
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildCurrentSongPos } = require('../util/util');

// Displays the current playing song
module.exports = {
	data: new SlashCommandBuilder()
		.setName('np')
		.setDescription('Zeigt dir an, was gerade spielt'),
	async execute(interaction) {
		logger.info(`Handling nowPlaying command used by "${interaction.user.tag}".`);

		const player = interaction.client.riffy.players.get(interaction.guild);

		if (!player) {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt nichts.');
			return;
		}

		const queue = player.queue;

		if (!queue || !queue.size || queue.size === 0) {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt nichts.');
			return;
		}

		const song = queue.first;
		const songEmbed = new EmbedBuilder()
			.setColor(0x000aff)
			.setTitle(`:musical_note: ${song.info.title}`)
			.setDescription(`Gerade spielt **${song.info.title}**. Der Song wurde von <@${song.info.requester.id}> eingereiht.\n\n${buildCurrentSongPos(player.position, song.info.length)}`)
			.setThumbnail(song.thumbnail);
		const openButton = new ButtonBuilder()
			.setLabel('Öffnen')
			.setStyle(ButtonStyle.Link)
			.setURL(song.url);

		logger.info(`${song.name} is now playing. This song was requested by "${song.member.user.tag}"`);

		interaction.reply({ embeds: [songEmbed], components: [new ActionRowBuilder().addComponents(openButton)] });
	},
};