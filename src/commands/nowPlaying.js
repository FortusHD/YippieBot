// Imports
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildCurrentSongPos } = require('../util/util');
const client = require('../main/main');

// Displays the current playing song
module.exports = {
	data: new SlashCommandBuilder()
		.setName('np')
		.setDescription('Zeigt dir an, was gerade spielt'),
	async execute(interaction) {
		logger.info(`Handling nowPlaying command used by "${interaction.user.tag}".`);

		const player = client.riffy.players.get(interaction.guildId);

		if (!player || !player.current) {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt nichts.');
			return;
		}

		const song = player.current;
		const songEmbed = new EmbedBuilder()
			.setColor(0x000aff)
			.setTitle(`:musical_note: ${song.info.title}`)
			.setDescription(`Gerade spielt **${song.info.title}**. Der Song wurde von <@${song.info.requester.id}> eingereiht.\n\n${buildCurrentSongPos(player.position, song.info.length)}`)
			.setThumbnail(song.thumbnail);
		const openButton = new ButtonBuilder()
			.setLabel('Öffnen')
			.setStyle(ButtonStyle.Link)
			.setURL(song.info.uri);

		logger.info(`${song.info.title} is now playing. This song was requested by "${song.info.requester.user.tag}"`);

		interaction.reply({ embeds: [songEmbed], components: [new ActionRowBuilder().addComponents(openButton)] });
	},
};