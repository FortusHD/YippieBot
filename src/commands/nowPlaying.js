// Imports
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildCurrentSongPos, buildEmbed } = require('../util/util');

// Displays the current playing song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Zeigt dir an, was gerade spielt'),
    async execute(interaction) {
        logger.info(`Handling nowPlaying command used by "${interaction.user.tag}".`);

        const client = interaction.client;
        const player = client.riffy.players.get(interaction.guildId);

        if (!player.current) {
            logger.info('Nothing playing right now.');
            await interaction.reply('Gerade spielt nichts.');
            return;
        }

        const song = player.current;
        const songEmbed = buildEmbed({
            color: 0x000aff,
            title: `:musical_note: ${song.info.title}`,
            description: `Gerade spielt **${song.info.title}**. Der Song wurde von `
				+ `<@${song.info.requester.id}> eingereiht.\n\n`
				+ `${buildCurrentSongPos(player.position, song.info.length)}`,
            origin: this.data.name,
            thumbnail: song.thumbnail,
        });
        const openButton = new ButtonBuilder()
            .setLabel('Öffnen')
            .setStyle(ButtonStyle.Link)
            .setURL(song.info.uri);

        logger.info(`${song.info.title} is now playing. This song was requested by "${song.info.requester.user.tag}"`);

        await interaction.reply({
            embeds: [songEmbed],
            components: [new ActionRowBuilder().addComponents(openButton)],
        });
    },
};