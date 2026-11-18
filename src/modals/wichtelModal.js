// Imports
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger');
const { insertOrUpdateParticipant } = require('../database/tables/wichtelParticipants');
const {
    isValidFriendCode, isValidSteamName, MAX_FRIEND_CODE_LENGTH, MAX_STEAM_NAME_LENGTH,
} = require('../util/steam');

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
                    .setMaxLength(MAX_STEAM_NAME_LENGTH)
                    .setRequired(true),
            ), new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('steamFriendCode')
                    .setLabel('Steam Freundes-Code (nur Zahlen)')
                    .setPlaceholder('z.B. 52079950')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(MAX_FRIEND_CODE_LENGTH)
                    .setRequired(true),
            ),
        ),
    async execute(interaction) {
        logger.info(`Handling wichtel modal submission by "${interaction.user.tag}".`);

        const member = interaction.member;

        if (member) {
            const steamName = interaction.fields.getTextInputValue('steamName').trim();
            const steamFriendCode = interaction.fields.getTextInputValue('steamFriendCode').trim();

            logger.debug(`Got following data: user: ${member.user.tag}, steamName: ${steamName} `
                + `steamFriendCode: ${steamFriendCode}`, __filename);

            if (!isValidSteamName(steamName)) {
                logger.info(`"${interaction.user.tag}" entered an invalid steam name.`);
                await interaction.reply({
                    content: `Der Steam-Name ist ungültig. Er muss zwischen 1 und ${MAX_STEAM_NAME_LENGTH} `
                        + 'Zeichen lang sein.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (!isValidFriendCode(steamFriendCode)) {
                logger.info(`"${interaction.user.tag}" entered an invalid steam friend code.`);
                await interaction.reply({
                    content: 'Der Freundes-Code ist ungültig. Du findest ihn in Steam unter '
                        + '*Freunde → Freund hinzufügen*. Er besteht nur aus Zahlen (z.B. `52079950`).',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            // Create a JSON object of participant
            const participant = {
                id: member.user.id,
                dcName: member.nickname ? member.nickname : member.user.username,
                steamName,
                steamFriendCode,
            };

            // Add participant to the file
            await insertOrUpdateParticipant(participant);

            await interaction.reply({ content: 'Du bist dem Wichteln beigetreten.', flags: MessageFlags.Ephemeral });

            logger.info(`Done handling wichtel modal submission by "${interaction.user.tag}".`);
        }
    },
};
