// Imports
const logger = require('../logging/logger');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { editInteractionReply } = require('../util/util');
const { endWichteln } = require('../threads/wichtelLoop');

// Forces wichteln to end and will delete wichtel message and match participants
module.exports = {
    guild: true,
    dm: true,
    devOnly: true,
    help: {
        usage: '/endwichteln',
        notes: 'Backup, falls das Wichteln nicht automatisch beendet wird',
    },
    data: new SlashCommandBuilder()
        .setName('endwichteln')
        .setDescription('Beendet das Wichteln')
        .setContexts([0, 1]),
    async execute(interaction) {
        logger.info(`Handling endWichteln command used by "${interaction.user.tag}".`);

        await interaction.reply({ content: 'Das wichteln wird beendet...', flags: MessageFlags.Ephemeral });
        const result = await endWichteln(interaction.client);

        await editInteractionReply(interaction, result);
        logger.info(`"${interaction.user.tag}" ended the wichteln.`);
    },
};