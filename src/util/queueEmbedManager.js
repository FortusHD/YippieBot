// Imports
const logger = require('../logging/logger');
const {formatDuration, buildEmbed} = require('./util');
const {ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Builds and displays an embed for the music queue, including pagination and editable options.
 *
 * @param {Object} interaction - The interaction object from the Discord API, used for context and client access.
 * @param {number} page - The requested page number of the queue embed to display.
 * @param {boolean} [edit=false] - Whether to edit an existing message or send a new reply.
 * @return {Promise<void>} Resolves when the embed has been successfully sent or edited.
 */
async function buildQueueEmbed(interaction, page, edit = false) {
    const client = interaction.client;
    const player = client.riffy.players.get(interaction.guildId);
    const queue = player?.queue;

    if (queue && queue.size > 1) {
        const maxPage = Math.floor(queue.size / 25 + 1);

        // Make sure the page is inside bounds
        if (!page || page <= 0) page = 1;
        if (page > maxPage) page = maxPage;

        logger.info(`"${interaction.member.guild.tag}" requested page ${page} of the queue.`);

        let queueString = '';

        // Determine which song are on the requested page
        for (let i = (page - 1) * 25 + 1; i < page * 25 + 1; i++) {
            if (i > queue.size - 1) {
                break;
            }

            queueString += `**${i}.** ${queue[i].info.title} \`${formatDuration(queue[i].info.length / 1000)}\` - <@${queue[i].info.requester.id}>\n`;
        }

        queueString = queueString.substring(0, queueString.length - 1);

        const queueEmbed = buildEmbed({
            color: 0x000aff,
            title: ':cd: Queue',
            description: queueString,
            origin: 'queue',
            footer: {text: ` • Seite ${page}/${maxPage}`}
        });

        const queueButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previouspage')
                    .setLabel('Vorherige Seite')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('nextpage')
                    .setLabel('Nächste Seite')
                    .setStyle(ButtonStyle.Primary),
            );

        logger.info('Sending queue embed.');

        if (edit) {
            await interaction.message.edit({ embeds: [queueEmbed], components: [queueButtons] });
        } else {
            await interaction.reply({ embeds: [queueEmbed], components: [queueButtons] });
        }
    } else {
        logger.info('Queue was empty.');
        if (edit) {
            await interaction.message.edit({ content: 'Die Queue ist leer.', embeds: [], components: [] } );
        } else {
            await interaction.reply('Die Queue ist leer.');
        }
    }
}

module.exports = { buildQueueEmbed };