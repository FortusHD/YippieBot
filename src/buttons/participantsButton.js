// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

// Sends a message to the user showing all participants
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('participants')
        .setLabel('Teilnehmer anzeigen')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling participants button pressed by "${interaction.user.tag}".`);

        let message = 'Noch nimmt niemand am Wichteln teil.';

        const participants = jsonManager.getParticipants();

        if (participants.length !== 0) {
            message = 'Teilnehmer:\n';
            for (const participant of participants) {
                message += `<@${participant.id}>, \`Friend-Code: ${participant.steamFriendCode}\`\n`;
            }
            message = message.trimEnd();
        }

        logger.debug(message, __filename);

        await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });

        logger.info(`Done handling participants button pressed by "${interaction.user.tag}".`);
    },
};