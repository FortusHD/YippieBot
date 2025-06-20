const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Builds and returns an Embed object based on the provided data.
 *
 * @param {Object} data - The data object used to configure the embed builder.
 * @param {string} data.color - The color of the embed.
 * @param {string} data.title - The title of the embed.
 * @param {string} data.description - The description of the embed.
 * @param {Array | undefined} data.fields - The fields to include in the embed.
 * @param {string | undefined} data.thumbnail - The URL of the embed's thumbnail image.
 * @param {string | undefined} data.image - The URL of the embed's main image.
 * @param {Object | undefined} data.footer - The footer configuration for the embed.
 * @param {string} data.origin -  The command which was used, to display in the footer.
 * @param {string} data.footer.text - Additional text to append to the footer.
 * @param {string | undefined} data.footer.iconURL - The URL of the footer's icon image.
 * @return {EmbedBuilder} A configured EmbedBuilder instance.
 */
function buildEmbed(data) {
    const footerText = `/${data.origin}${ data.footer?.text ? ` ${data.footer.text}` : ''}`;

    const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: data.footer?.iconURL });

    if (data.fields) {
        embed.setFields(data.fields);
    }
    if (data.thumbnail) {
        embed.setThumbnail(data.thumbnail);
    }
    if (data.image) {
        embed.setImage(data.image);
    }

    return embed;
}

/**
 * Builds and returns an embed object with the specified color, title, and fields.
 *
 * @param {string} color - The color of the embed in a valid color format (e.g., HEX or predefined color constants).
 * @param {string} title - The title of the embed.
 * @param {Array<Object>} fields - An array of field objects, where each field contains a name and value property
 * for the embed content.
 * @return {EmbedBuilder} The constructed EmbedBuilder object with the provided properties.
 */
function buildRoleEmbed(color, title, fields) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setFields(fields);
}

/**
 * Constructs and returns an Embed formatted for error messages.
 *
 * @param {string} errorMessage - The error message to be displayed in the embed description.
 * @param {Array<Object>} fields - An array of field objects where each object contains field properties for the embed
 * (e.g., name and value).
 * @return {EmbedBuilder} An embed object configured with the provided error message and fields.
 */
function buildErrorEmbed(errorMessage, fields) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Error Alert')
        .setDescription(errorMessage)
        .setFields(fields);
}

/**
 * Constructs and returns an embed containing a list of all available commands
 * with their respective descriptions and metadata. The embed includes
 * information such as whether the command can be used in servers, DMs, voice
 * channels, or if it is admin-only.
 *
 * @return {EmbedBuilder} An embed object with the list of commands and their details.
 */
function buildAllCommandsEmbed() {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const embed = new EmbedBuilder()
        .setColor('#0dec09')
        .setTitle('Alle Befehle')
        .setDescription('Hier ist eine Liste aller Befehle:')
        .setTimestamp()
        .setFooter({ text: '/help' });

    for (const file of commandFiles) {
        const command = require(`${commandsPath}/${file}`);
        if (command.data && command.data.name && command.data.description) {
            const guildEmoji = command.guild === false ? '❌' : '✅';
            const dmEmoji = command.dm === false ? '❌' : '✅';
            const vcEmoji = command.vc === true ? '✅' : '❌';
            const devEmoji = command.devOnly === true ? '✅' : '❌';

            embed.addFields({
                name: `/${command.data.name}`,
                value: `${command.data.description}\n\n`
                    + `- Server: ${guildEmoji}\n`
                    + `- DM: ${dmEmoji}\n`
                    + `- Du musst im Voice sein: ${vcEmoji}\n`
                    + `- Admin Only: ${devEmoji}`,
            });
        }
    }

}

/**
 * Builds a help embed for a specific command by retrieving its metadata and details from available command files.
 *
 * @param {string} commandName - The name of the command for which the help embed will be built.
 * @return {EmbedBuilder|null} An EmbedBuilder object containing details about the command if found; otherwise, null.
 */
function buildHelpEmbed(commandName) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`${commandsPath}/${file}`);
        if (command.data && command.data.name && command.data.name === commandName.toLowerCase()) {
            const guildEmoji = command.guild === false ? '❌' : '✅';
            const dmEmoji = command.dm === false ? '❌' : '✅';
            const vcEmoji = command.vc === true ? '✅' : '❌';
            const devEmoji = command.devOnly === true ? '✅' : '❌';

            const embed = new EmbedBuilder()
                .setColor('#0dec09')
                .setTitle(`Hilfe für /${command.data.name}`)
                .setDescription(command.data.description)
                .setTimestamp()
                .setFooter({ text: '/help' });

            let optionsList = '';
            if (command.data.data.options && command.data.data.options.length > 0) {
                optionsList = command.data.data.options.map(option => {
                    const isRequired = option.required ? 'Ja' : 'Nein';
                    return `**Name**: ${option.name}: ${option.description}(**Erforderlich**: ${isRequired})`;
                }).join('\n\n');
            }

            const fields = [
                {
                    name: 'Benutzung:',
                    value: command.help.usage,
                },
            ];

            if (command.help.examples) {
                fields.push({
                    name: 'Beispiel:',
                    value: command.help.examples,
                });
            }

            if (optionsList !== '') {
                fields.push({
                    name: 'Argumente:',
                    value: optionsList,
                });
            }

            if (command.devOnly === true) {
                fields.push({
                    name: 'Berechtigungen:',
                    value: `- Admin Only: ${devEmoji}`,
                });
            }

            fields.push({
                name: 'Verfügbarkeit:',
                value: `- Du musst im Voice sein: ${vcEmoji}\n`
                    + `- Server: ${guildEmoji}\n`
                    + `- DM: ${dmEmoji}\n`,
            });

            if (command.help.notes) {
                fields.push({
                    name: 'Hinweise:',
                    value: command.help.notes,
                });
            }

            embed.addFields(fields);

            return embed;
        }
    }

    return null;
}

module.exports = { buildEmbed, buildRoleEmbed, buildErrorEmbed, buildAllCommandsEmbed, buildHelpEmbed };