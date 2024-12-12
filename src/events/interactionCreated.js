// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const config = require('config');
const { notifyAdminCookies } = require('../util/util');

// Handles all user interaction (command, button and modal submission)
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			// Commands
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				logger.error(`No command matching ${interaction.commandName} was found.`, __filename);
				return;
			}

			logger.info(`${interaction.user.tag} used the "${interaction.commandName}" command.`);

			try {
				await command.execute(interaction);
			} catch (error) {
				// Catch some common errors
				if (error.rawError && error.rawError.message === 'Unknown interaction') {
					logger.warn('Interaction was not found (race-condition?), ignoring.');
				} else {
					logger.error(error, __filename);

					let error_message = 'Da ist etwas beim Ausführen dieses Befehls schiefgelaufen!';

					if (error.name === 'PlayError') {
						// Cookies are needed for YouTube requests
						error_message = `Die Cookies des Bots könnten abgelaufen sein. <@${config.get('ADMIN_USER_ID')}> wurde darüber informiert.`;
						await notifyAdminCookies(interaction);
					} else if (error.name === 'InteractionNotReplied') {
						// Sometimes an interaction cannot be replied to
						error_message = 'Leider gab es einen Fehler als ich auf deinen Befehl antworten wollte. Probiere es gleich nochmal.';
					}

					// Try to send the message to the user
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: error_message, ephemeral: true });
					} else {
						await interaction.reply({ content: error_message, ephemeral: true });
					}
				}
			}
		} else if (interaction.isButton()) {
			// Buttons
			const button = interaction.client.buttons.get(interaction.customId);

			if (!button) {
				logger.error(`No button matching ${interaction.customId} was found.`, __filename);
				return;
			}

			logger.info(`${interaction.user.tag} pressed the "${interaction.customId}" button.`);

			try {
				await button.execute(interaction);
			} catch (error) {
				logger.error(error, __filename);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: 'Da ist etwas beim Ausführen dieses Knopfes schiefgelaufen!',
						ephemeral: true
					});
				} else {
					await interaction.reply({
						content: 'Da ist etwas beim Ausführen dieses Knopfes schiefgelaufen!',
						ephemeral: true
					});
				}
			}
		} else if (interaction.isModalSubmit()) {
			// Modals
			const modal = interaction.client.modals.get(interaction.customId);

			if (!modal) {
				logger.error(`No modal matching ${interaction.customId} was found.`, __filename);
				return;
			}

			logger.info(`${interaction.user.tag} submitted the "${interaction.customId}" modal.`);

			try {
				await modal.execute(interaction);
			} catch (error) {
				logger.error(error, __filename);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: 'Da ist etwas beim Absenden dieses Modals schiefgelaufen!',
						ephemeral: true
					});
				} else {
					await interaction.reply({
						content: 'Da ist etwas beim Absenden dieses Modals schiefgelaufen!',
						ephemeral: true
					});
				}
			}
		}
	},
};