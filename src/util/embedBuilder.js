const { EmbedBuilder } = require('discord.js');

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
 * Builds and returns an embed containing a list of all commands with their descriptions
 * and relevant usage information.
 *
 * @param {import(discord.js).Collection} commands A collection of command objects,
 * each containing metadata such as name, description, and context usage flags.
 * @return {EmbedBuilder} The constructed embed containing the list of commands and their details.
 */
function buildAllCommandsEmbed(commands) {
    const categories = {};

    for (const command of commands.values()) {
        const category = command.help.category;
        (categories[category] || (categories[category] = [])).push(command);
    }

    const embed = new EmbedBuilder()
        .setColor('#0dec09')
        .setTitle('Alle Befehle')
        .setDescription('Hier ist eine Liste aller Befehle:')
        .setTimestamp()
        .setFooter({ text: '/help' });

    for (const [category, commandList] of Object.entries(categories)) {
        const value = commandList
            .map(command => `- \`/${command.data.name}\`: ${command.data.description}`)
            .join('\n');

        embed.addFields({
            name: `**${category}**`,
            value: value,
            inline: false,
        });
    }

    return embed;
}

/**
 * Builds a help embed for the specified command, providing detailed information about its usage, arguments, examples,
 * and availability.
 *
 * @param {Object} command - The command object containing data such as metadata, help information, and restrictions.
 * @param {Object} command.data - The metadata associated with the command.
 * @param {string} command.data.name - The name of the command.
 * @param {string} command.data.description - A description of the command's functionality.
 * @param {Array} [command.data.options] - An array of command options containing details like name, description,
 * and requirement status.
 * @param {boolean} [command.guild] - Indicates whether the command is restricted to guilds
 * (true: available, false: unavailable).
 * @param {boolean} [command.dm] - Indicates whether the command is available in direct messages
 * (true: available, false: unavailable).
 * @param {boolean} [command.vc] - Indicates whether the user must be in a voice channel to execute the command.
 * @param {boolean} [command.devOnly] - Indicates whether the command is restricted to developers only.
 * @param {Object} command.help - Help information about the command.
 * @param {string} command.help.usage - A usage example explaining how to use the command.
 * @param {string} [command.help.examples] - Examples of how to use the command.
 * @param {string} [command.help.notes] - Additional notes regarding the command's behavior or restrictions.
 * @return {Object} EmbedBuilder object containing the help information for the specified command.
 */
function buildHelpEmbed(command) {
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
    if (command.data.options && command.data.options.length > 0) {
        optionsList = command.data.options.map(option => {
            const isRequired = option.required ? 'Ja' : 'Nein';
            return `**${option.name}**: ${option.description} - (**Erforderlich**: ${isRequired})`;
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

module.exports = { buildEmbed, buildRoleEmbed, buildErrorEmbed, buildAllCommandsEmbed, buildHelpEmbed };