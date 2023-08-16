const { ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

module.exports = {
	data: new ButtonBuilder()
		.setCustomId('participate')
		.setLabel('Teilnehmen')
		.setStyle(ButtonStyle.Primary),
	async execute(interaction) {
		logger.info(`${interaction.user.tag} pressed participate button.`);

		const member = interaction.member;

		if (member) {
			const participant = {
				dcName: member.nickname ? member.nickname : member.user.username,
				steamName: 'TBD',
				id: member.user.id,
				participates: true,
			};

			await jsonManager.participantJoined(participant);

			interaction.reply({ content: 'Du bist dem Wichteln beigetreten!', ephemeral: true });
		}
	},
};