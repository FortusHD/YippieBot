// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const wichtelModal = require('../modals/wichtelModal.js');
const logger = require('../logging/logger.js');

// Starts the participating progress by showing a modal to enter the steam data
module.exports = {
	data: new ButtonBuilder()
		.setCustomId('participate')
		.setLabel('Teilnehmen')
		.setStyle(ButtonStyle.Primary),
	async execute(interaction) {
		logger.info(`${interaction.user.tag} pressed participate button.`);

		const member = interaction.member;

		if (member) {
			await interaction.showModal(wichtelModal.data);
		}
	},
};