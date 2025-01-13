// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Bot joins voice channel of current user
module.exports = {
	guild: true,
	dm: false,
	vc: true,
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Holt den Bot in deinen Channel'),
	async execute(interaction) {
		logger.info(`Handling join command used by "${interaction.user.tag}".`);

		const client = interaction.client;
		const voiceChannel = interaction.member.voice.channel;

		logger.info(`Joining ${voiceChannel.name}.`);
		client.riffy.createConnection({
			guildId: interaction.guild.id,
			voiceChannel: interaction.member.voice.channel.id,
			textChannel: interaction.channel.id,
			deaf: true,
		});
		await interaction.reply({ content: 'Servus', ephemeral: true });
	},
};