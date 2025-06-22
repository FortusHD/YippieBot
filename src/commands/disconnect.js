// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Disconnects bot from the current connected voice channel
module.exports = {
    player: true,
    guild: true,
    dm: false,
    help: {
        category: 'Musik',
        usage: '/dc',
        notes: 'Der Bot verabschiedet sich sogar.',
    },
    data: new SlashCommandBuilder()
        .setName('dc')
        .setDescription('Disconnected den Bot'),
    async execute(interaction) {
        logger.info(`Handling disconnect command used by "${interaction.user.tag}".`);

        const dismisses = ['Tschö mit Ö', 'Tschau mit AU', 'Meddl off', 'Bis Baldrian', 'Tschüsseldorf',
            'Ich verabscheue mich', 'Tschau, du Sau', 'Tschüss mit Üs', 'Sayonara Carbonara', 'Auf Wiederhörnchen',
            'Man siebt sich'];

        const client = interaction.client;
        const player = client.riffy.players.get(interaction.guildId);

        logger.debug(`Got following data: guild: ${interaction.guild.name}, `
            + `node: ${player?.node?.host}`, __filename);

        if (player?.disconnect) {
            const disconnected = await player.disconnect();
            if (disconnected?.destroy) {
                await disconnected.destroy();
            }
        }
        await interaction.reply(dismisses[Math.floor(Math.random() * dismisses.length)]);

        logger.info(`Bot was disconnected by "${interaction.user.tag}".`);
    },
};