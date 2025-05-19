// Imports
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const jsonManager = require('../util/json_manager.js');
const logger = require('../logging/logger');

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
                    .setRequired(true),
            ), new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('steamFriendCode')
                    .setLabel('Steam Freundes-Code')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            ),
        ),
    async execute(interaction) {
        logger.info(`Handling wichtel modal submission by "${interaction.user.tag}".`);

        const member = interaction.member;

        if (member) {
            // Create a JSON object of participant
            const participant = {
                id: member.user.id,
                dcName: member.nickname ? member.nickname : member.user.username,
                steamName: interaction.fields.getTextInputValue('steamName'),
                steamFriendCode: interaction.fields.getTextInputValue('steamFriendCode'),
            };

            logger.debug(`Got following data: user: ${member.user.tag}, `
                + `steamName: ${interaction.fields.getTextInputValue('steamName')} `
                + `steamFriendCode: ${interaction.fields.getTextInputValue('steamFriendCode')}`, __filename);

            // Add participant to the file
            jsonManager.participantJoined(participant);

            await interaction.reply({ content: 'Du bist dem Wichteln beigetreten.', flags: MessageFlags.Ephemeral });

            logger.info(`Done handling wichtel modal submission by "${interaction.user.tag}".`);
        }
    },
};