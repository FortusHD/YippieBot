// Imports
const logger = require("../logging/logger");
const {formatDuration, buildEmbed} = require("./util");
const {ActionRowBuilder} = require("discord.js");
const queuePreviousPageButton = require('../buttons/queuePreviousPageButton');
const queueNextPageButton = require('../buttons/queueNextPageButton');


async function buildQueueEmbed(interaction, page, edit = false) {
    const client = interaction.client;
    const player = client.riffy.players.get(interaction.guildId);
    const queue = player.queue;

    if (queue && queue.size > 1) {
        const maxPage = Math.floor(queue.size / 25 + 1);

        // Make sure page is inside bounds
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
            origin: this.data.name,
            footer: ` • Seite ${page}/${maxPage}`
        });
        const queueButtons = new ActionRowBuilder()
            .addComponents(queuePreviousPageButton.data, queueNextPageButton.data)

        logger.info('Sending queue embed.');

        if (edit) {
            await interaction.message.edit({ embeds: [queueEmbed], components: [queueButtons] });
        } else {
            await interaction.reply({ embeds: [queueEmbed], components: [queueButtons] });
        }
    } else {
        logger.info('Queue was empty.');
        if (edit) {
            await interaction.message.edit('Die Queue ist leer.')
        } else {
            await interaction.reply('Die Queue ist leer.');
        }
    }
}

module.exports = { buildQueueEmbed }