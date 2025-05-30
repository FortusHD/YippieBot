// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply, buildEmbed } = require('../util/util');

// Skips the current playing song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den aktuellen Song'),
    async execute(interaction) {
        logger.info(`Handling skip command used by "${interaction.user.tag}".`);
        await interaction.reply('Überspringe...');

        const client = interaction.client;
        const player = client.riffy.players.get(interaction.guildId);

        logger.debug(`Got following data: guild: ${interaction.guild.name}, `
            + `node: ${player?.node?.host}`, __filename);

        if (player.current) {
            const skippedSong = player.current;
            const newSong = player.queue ? player.queue.first : null;

            await player.stop();

            logger.info(`${skippedSong.info.title} skipped! ${newSong
                ? `Now playing: ${newSong.info.title}.`
                : 'Queue is empty.'}`);
            const skipEmbed = buildEmbed({
                color: 0x000aff,
                title: `:fast_forward: ${skippedSong.info.title} übersprungen`,
                description: `**${skippedSong.info.title}** wurde übersprungen!\n${newSong
                    ? `Jetzt läuft: **${newSong.info.title}**`
                    : 'Die Warteschlange ist jetzt leer.'}`,
                origin: this.data.name,
            });
            await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] });
        } else {
            logger.info('No song playing.');
            await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
        }
    },
};