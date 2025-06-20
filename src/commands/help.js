// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildAllCommandsEmbed, buildHelpEmbed } = require('../util/embedBuilder');

// Help command to list all available commands
module.exports = {
    guild: true,
    dm: true,
    help: {
        usage: '/help <command>',
        examples: '`/help` | `/help command:help`',
    },
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Gibt dir eine Liste aller Befehle an, oder spezifische Hilfe zu einem bestimmten Befehl')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Der Command zu dem du Hilfe erhalten willst')
                .setRequired(false)),
    async execute(interaction) {
        logger.info(`Handling help command used by "${interaction.user.tag}".`);

        const command = interaction.options.getString('command');

        let helpEmbed;

        if (command) {
            // TODO: Check if command exists
            helpEmbed = buildHelpEmbed(command);
        } else {
            helpEmbed = buildAllCommandsEmbed();
        }

        // Send the embed as a reply
        await interaction.reply({ embeds: [helpEmbed] });

        logger.info(`Help command completed for "${interaction.user.tag}".`);
    },
};
