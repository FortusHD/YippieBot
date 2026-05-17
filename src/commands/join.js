// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { getAdminUserId } = require('../util/config');
const { getOrCreatePlayer } = require('../util/util');

// Bot joins voice channel of current user
module.exports = {
    guild: true,
    dm: false,
    vc: true,
    help: {
        category: 'Musik',
        usage: '/join',
        notes: 'Der Bot kann auch geholt werden, wenn er gerade in einem anderen Channel ist.',
    },
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Holt den Bot in deinen Channel'),
    async execute(interaction) {
        logger.info(`Handling join command used by "${interaction.user.tag}".`);

        const client = interaction.client;
        const voiceChannel = interaction.member.voice.channel;

        logger.debug(`Got following data: guild: ${interaction.guild.name}, `
            + `channel: ${voiceChannel.name}`, __filename);

        const player = await getOrCreatePlayer(client, interaction);

        if (!player) {
            await interaction.reply({
                content: `Der Bot kann gerade leider keine Musik abspielen. Melde dich bei <@${getAdminUserId()}>`,
            });
            return;
        }

        await interaction.reply({ content: 'Servus', flags: MessageFlags.Ephemeral });
    },
};