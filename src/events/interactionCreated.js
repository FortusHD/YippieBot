// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const config = require('config');
const { notifyAdminCookies } = require('../util/util');

// Handles all user interaction (command and button)
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				logger.error(`No command matching ${interaction.commandName} was found.`, __filename);
				return;
			}

			logger.info(`${interaction.user.tag} used the "${interaction.commandName}" command.`);

			try {
				await command.execute(interaction);
			} catch (error) {
				logger.error(error, __filename);

				let error_message = 'Da ist etwas beim Ausführen dieses Befehls schiefgelaufen!'

				if (error.name === 'PlayError') {
					error_message = `Die Cookies des Bots könnten abgelaufen sein. <@${config.get('ADMIN_USER_ID')}> wurde darüber informiert.`;
					await notifyAdminCookies(interaction)
				}

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: error_message, ephemeral: true });
				} else {
					await interaction.reply({ content: error_message, ephemeral: true });
				}
			}
		} else if (interaction.isButton()) {
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
					await interaction.followUp({ content: 'Da ist etwas beim Ausführen dieses Knopfes schiefgelaufen!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Da ist etwas beim Ausführen dieses Knopfes schiefgelaufen!', ephemeral: true });
				}
			}
		}
	},
};