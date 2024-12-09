// Imports
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const jsonManager = require('../util/json_manager.js');

// Adds current user to the participants with the steam data
module.exports = {
	data: new ModalBuilder()
		.setCustomId('steamData')
		.setTitle('Steam-Daten')
		.addComponents(
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('steamName')
					.setLabel('Steam Name')
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
			), new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('steamFriendCode')
					.setLabel('Steam Freundes-Code')
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
			)
		),
	async execute (interaction) {
		const member = interaction.member;

		if (member) {
			// Create json object of participant
			const participant = {
				id: member.user.id,
				dcName: member.nickname ? member.nickname : member.user.username,
				steamName: interaction.fields.getTextInputValue('steamName'),
				steamFriendCode: interaction.fields.getTextInputValue('steamFriendCode')
			};

			// Add participant to file
			jsonManager.participantJoined(participant);

			await interaction.reply({content: 'Du bist dem Wichteln beigetreten.', ephemeral: true});
		}
	},
};