// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
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
            const commandFile = interaction.client.commands.get(command.toLowerCase());
            if (!commandFile) {
                logger.info(`"${interaction.user.tag}" entered an invalid command: ${command}.`);
                await interaction.reply({
                    content: `Den Befehl \`${command}\` gibt es nicht. Mit \`/help\` siehst du alle bekannten Befehle.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            logger.debug(`Got following data: command: ${command}`, __filename);
            helpEmbed = buildHelpEmbed(commandFile);
        } else {
            logger.debug('Got following data: command: NULL', __filename);
            helpEmbed = buildAllCommandsEmbed(interaction.client.commands);
        }

        // Send the embed as a reply
        await interaction.reply({ embeds: [helpEmbed] });

        logger.info(`Help command completed for "${interaction.user.tag}".`);
    },
};