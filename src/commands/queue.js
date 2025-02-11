// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { formatDuration, buildEmbed } = require('../util/util');

// Displays the current queue
module.exports = {
	guild: true,
	dm: false,
	player: true,
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Zeigt dir die aktuelle Queue')
		.addIntegerOption(option =>
			option
				.setName('page')
				.setDescription('Die Seite der Queue, die du sehen willst (25 Songs pro Seite)')
				.setRequired(false)),
	async execute(interaction) {
		logger.info(`Handling queue command used by "${interaction.user.tag}".`);

		const client = interaction.client;
		const player = client.riffy.players.get(interaction.guildId);
		const queue = player.queue;

		if (queue && queue.size > 1) {
			let page = interaction.options.getInteger('page');
			const maxPage = Math.floor(queue.size / 25 + 1);

			if (!page || page <= 0) page = 1;
			if (page > maxPage) page = maxPage;

			logger.info(`"${interaction.member.guild.tag}" requested page ${page} of the queue.`);

			let queueString = '';

			// Calculate which song are on the requested page
			for (let i = (page - 1) * 25 + 1; i < page * 25 + 1; i++) {
				if (i > queue.size - 1) {
					break;
				}

				queueString += `**${i}.** ${queue[i].info.title} \`${formatDuration(queue[i].info.length / 1000)}\` - <@${queue[i].info.requester.id}>\n`;
			}

			queueString = queueString.substring(0, queueString.length - 1);

			const queueEmbed = buildEmbed({
				color: 0x000aff,
				title: ':cd: Queue',
				description: queueString,
				origin: this.data.name,
				footer: ` • Seite ${page}/${maxPage}`
			});
			// TODO: Add buttons to switch pages?
			await interaction.reply({ embeds: [queueEmbed] });

			logger.info('Queue was sent.');
		} else {
			logger.info('Queue was empty.');
			await interaction.reply('Die Queue ist leer.');
		}
	},
};