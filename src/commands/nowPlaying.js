// Imports
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildCurrentSongPos } = require('../util/util');
const { buildEmbed } = require('../util/embedBuilder');

// Displays the current playing song
module.exports = {
    guild: true,
    dm: false,
    player: true,
    help: {
        category: 'Musik',
        usage: '/np',
        notes: 'Gibt dir praktische Infos über den aktuell laufenden Song. '
            + 'Dort ist auch ein Knopf mit dem Link zum Song.',
    },
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Zeigt dir an, was gerade spielt'),
    async execute(interaction) {
        logger.info(`Handling nowPlaying command used by "${interaction.user.tag}".`);

        const client = interaction.client;
        const player = client.riffy.players.get(interaction.guildId);

        logger.debug(`Got following data: guild: ${interaction.guild.name}, `
            + `node: ${player?.node?.host}`, __filename);

        if (!player.current) {
            logger.info('Nothing playing right now.');
            await interaction.reply('Gerade spielt nichts.');
            return;
        }

        const song = player.current;

        logger.debug(`Current song playing: ${song.info.title} with position: ${player.position} `
            + ` and length: ${song.info.length}. Thumbnail: ${song.info.thumbnail}`, __filename);

        const songEmbed = buildEmbed({
            color: 0x000aff,
            title: `:musical_note: ${song.info.title}`,
            description: `Gerade spielt **${song.info.title}**. Der Song wurde von `
				+ `<@${song.info.requester.id}> eingereiht.\n\n`
				+ `${buildCurrentSongPos(player.position, song.info.length)}`,
            origin: this.data.name,
            thumbnail: song.info.thumbnail,
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