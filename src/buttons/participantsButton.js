// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { getParticipants } = require('../database/tables/wichtelParticipants');
const { sanitizeCodeSpan, splitMessage } = require('../util/message');

// Sends a message to the user showing all participants
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('participants')
        .setLabel('Teilnehmer anzeigen')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling participants button pressed by "${interaction.user.tag}".`);

        let message = 'Noch nimmt niemand am Wichteln teil.';

        const participants = await getParticipants();

        if (participants.length !== 0) {
            message = 'Teilnehmer:\n';
            for (const participant of participants) {
                message += `<@${participant.id}>, \`Friend-Code: ${sanitizeCodeSpan(participant.steamFriendCode)}\`\n`;
            }
            message = message.trimEnd();
        }

        logger.debug(message, __filename);

        // A message may only have 2000 characters, so a long list is sent in several messages
        const [first, ...rest] = splitMessage(message);
        await interaction.reply({ content: first, flags: MessageFlags.Ephemeral });
        for (const part of rest) {
            await interaction.followUp({ content: part, flags: MessageFlags.Ephemeral });
        }

        logger.info(`Done handling participants button pressed by "${interaction.user.tag}".`);
    },
};
