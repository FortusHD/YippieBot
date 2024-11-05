// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

// Sends message tt user showing all participants
module.exports = {
	data: new ButtonBuilder()
		.setCustomId('participants')
		.setLabel('Teilnehmer anzeigen')
		.setStyle(ButtonStyle.Primary),
	async execute(interaction) {
		logger.info(`${interaction.user.tag} pressed participants button.`);

		let message = 'Noch nimmt niemand am Wichteln teil.';

		const participants = await jsonManager.getParticipants();

		if (participants.length !== 0) {
			message = 'Teilnehmer:\n';
			const pIds = participants.map(p => p.id);
			for (const pId of pIds) {
				message += `<@${pId}>\n`;
			}
		}

		interaction.reply({ content: message, ephemeral: true });
	},
};