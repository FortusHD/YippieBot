// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');

// Frees a prisoner from the list
module.exports = {
    guild: true,
    dm: false,
    help: {
        category: 'Deportation',
        usage: '/permit <user>',
        examples: '`/permit user:@Bot-ler#3822`',
        notes: 'Befreit einen User, der durch `/deport` festgehalten wurde.',
    },
    data: new SlashCommandBuilder()
        .setName('permit')
        .setDescription('Hiermit wird ein User repatriiert')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User, der repatriiert werden soll')
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling permit command used by "${interaction.user.tag}".`);

        const user = interaction.options.getUser('user');
        const guild = interaction.guild;
        const member = guild.members.cache.get(user.id);

        logger.debug(`Got following data: user: ${user.tag}, guild: ${guild.name}, `
            + `member: ${member ? member.tag : 'NULL'}`, __filename);

        if (member) {
            data.removePrisoner(member.id);
            logger.info(`"${user.tag}" was permitted by "${interaction.user.tag}".`);
            interaction.reply(`${user.tag} wurde repatriiert!`);
        } else {
            logger.info(`"${interaction.user.tag}" entered an invalid user.`);
            interaction.reply({ content: 'Du hast einen invaliden User angegeben!', flags: MessageFlags.Ephemeral });
        }
    },
};