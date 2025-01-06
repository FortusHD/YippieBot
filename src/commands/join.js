// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Bot joins voice channel of current user
module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Holt den Bot in deinen Channel'),
	async execute(interaction) {
		logger.info(`Handling join command used by "${interaction.user.tag}".`);

		const voiceChannel = interaction.member.voice.channel;

		if (voiceChannel) {
			logger.info(`Joining ${voiceChannel.name}.`);
			interaction.client.riffy.createConnection({
				guildId: interaction.guild.id,
				voiceChannel: interaction.member.voice.channel.id,
				textChannel: interaction.channel.id,
				deaf: true,
			})
			interaction.reply({ content: 'Servus', ephemeral: true });
		} else {
			logger.info(`"${interaction.member.user.tag}" was not in a voice channel.`);
			interaction.reply({ content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen', ephemeral: true });
		}
	},
};