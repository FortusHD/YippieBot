const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Holt den Bot in deinen Channel'),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested the bot to join.`);

		const voiceChannel = interaction.member.voice.channel;

		if (voiceChannel) {
			logger.info(`Joining ${voiceChannel.name}.`);
			await interaction.client.distube.voices.join(voiceChannel);
			interaction.reply({ content: 'Servus', ephemeral: true });
		} else {
			logger.info(`${interaction.member.user.tag} was not in a voice channel.`);
			interaction.reply({ content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen', ephemeral: true });
		}
	},
};