// Imports
const logger = require('../logging/logger');
const { SlashCommandBuilder } = require('discord.js');
const config = require('config');
const { editInteractionReply } = require('../util/util');
const { endWichteln } = require('../util/wichtelLoop');

// Forces wichteln to end, will delete wichtel message and match participants
module.exports = {
	data: new SlashCommandBuilder()
		.setName('endwichteln')
		.setDescription('Beendet das Wichteln')
		.setContexts([1]),
	async execute(interaction) {
		logger.info(`Handling endWichteln command used by "${interaction.user.tag}".`);

		await interaction.reply({ content: 'Das wichteln wird beendet...', ephemeral: false });

		// Only ADMIN is allowed to end wichteln
		if (interaction.user.id === config.get('ADMIN_USER_ID')) {
			const result = await endWichteln(interaction.client);

			await editInteractionReply(interaction, result);
		} else {
			logger.info(`"${interaction.user.tag}" does not have permission to end the wichteln.`);
			await editInteractionReply(interaction, { content: 'Dazu hast du keine Berechtigung!', ephemeral: true });
		}

		logger.info(`"${interaction.user.tag}" ended the wichteln.`);
	},
};