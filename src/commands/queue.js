// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Displays the current queue
module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Zeigt dir die aktuelle Queue')
		.addIntegerOption(option =>
			option
				.setName('page')
				.setDescription('Die Seite der Queue, die du sehen willst (25 Songs pro Seite)')
				.setRequired(false)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested to see the queue.`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue && queue.songs && queue.songs.length > 1) {
			let page = interaction.options.getInteger('page');
			const maxPage = Math.floor(queue.songs.length / 25 + 1);

			if (!page || page <= 0) page = 1;
			if (page > maxPage) page = maxPage;

			logger.info(`${interaction.member.guild.tag} requested page ${page} of the queue.`);

			let queueString = '';

			// Calculate which song are on the requested page
			for (let i = (page - 1) * 25 + 1; i < page * 25 + 1; i++) {
				if (i > queue.songs.length - 1) {
					break;
				}

				queueString += `**${i}.** ${queue.songs[i].name} \`${queue.songs[i].formattedDuration}\` 
				- <@${queue.songs[i].member.id}>\n`;
			}

			queueString = queueString.substring(0, queueString.length - 1);

			const queueEmbed = new EmbedBuilder()
				.setColor(0x000aff)
				.setTitle(':cd: Queue')
				.setDescription(queueString)
				.setFooter({ text: `Seite ${page}/${maxPage}` });

			interaction.reply({ embeds: [queueEmbed] });

		} else {
			logger.info('Queue was empty.');
			interaction.reply('Die Queue ist leer.');
		}
	},
};