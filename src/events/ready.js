// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const config = require('../util/config');
const { startWichtelLoop } = require('../threads/wichtelLoop');
const { startPollLoop } = require('../threads/pollLoop');
const { startLavalinkLoop } = require('../threads/lavalinkLoop');
const { startLogLoop } = require('../threads/logLoop');
const { buildRoleEmbed } = require('../util/embedBuilder');
const { insertOrUpdateId, getId } = require('../database/tables/messageIDs');
const { getAllPolls } = require('../database/tables/polls');

// Gets handled after bot login is completed
module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Set up riffy
        client.riffy.init(client.user.id);

        logger.info(`Ready! Logged in as ${client.user.tag}`);

        // Sending a reaction role message if this message does not exist
        const guild = client.guilds.cache.get(config.getGuildId());

        if (guild) {
            const roleChannel = await guild.channels.cache.get(config.getRoleChannelId());

            if (roleChannel) {
                // Message data
                const color = 0x22E5AA;
                const title = 'Lustige Rollen';
                const fields = [
                    {
                        inline: false,
                        name: `${guild.emojis.cache.find(emoji => emoji.name === 'schanze')} Drachi`,
                        value: 'Damit erhältst du Zugang zur Drachenschanze',
                    },
                    {
                        inline: false,
                        name: `${guild.emojis.cache.find(emoji => emoji.name === 'free')} Gratis ist der Beste Preis`,
                        value: 'Damit wirst du immer informiert, wenn es was gratis zu holen gibt',
                    },
                    {
                        inline: false,
                        name: `${guild.emojis.cache.find(emoji => emoji.name === 'nsfw')} NSFW`,
                        value: 'Damit gönnst du dir Zugang zum **babes**-Channel. Viel Spaß :wink:',
                    },
                    {
                        inline: false,
                        name: `${guild.emojis.cache.find(emoji => emoji.name === 'rene')} Bobbys CS Videos`,
                        value: 'Hiermit weißt du immer, wann Bobby wieder Mal eine neue Folge CS hochgeladen hat.',
                    },
                ];

                // Reactions
                const reactions = [
                    config.getDrachiEmojiId(),
                    config.getFreeEmojiId(),
                    config.getNsfwEmojiId(),
                    config.getBobbyEmojiId(),
                ];

                // Build the message
                const reactionEmbed = buildRoleEmbed(color, title, fields);

                const currentMessageID = await getId('roleId');
                roleChannel.messages.fetch().then(async messages => {
                    let message = messages.get(currentMessageID);

                    if (messages.size === 0 || !message) {
                        logger.info('No reaction message found, so a new one will be created');

                        // Send and add reactions
                        message = await roleChannel.send({ embeds: [reactionEmbed] });
                        for (const reaction of reactions) {
                            await message.react(reaction);
                        }

                        await insertOrUpdateId('roleId', message.id);
                    } else {
                        // Check if the message needs to be updated
                        let change = false;

                        const currentEmbed = message.embeds[0];

                        if (currentEmbed.title !== reactionEmbed.data.title
                            || currentEmbed.color !== reactionEmbed.data.color
                            || currentEmbed.fields.length !== reactionEmbed.data.fields.length) {
                            change = true;
                        }

                        for (let i = 0; i < currentEmbed.fields.length; i++) {
                            if (currentEmbed.fields[i].name !== reactionEmbed.data.fields[i].name
                                || currentEmbed.fields[i].value !== reactionEmbed.data.fields[i].value) {
                                change = true;
                                break;
                            }
                        }

                        if (change) {
                            // Update message
                            logger.info('Reaction message needs to be updated, so it will be updated');

                            message.edit({ embeds: [reactionEmbed] }).then(async () => {
                                for (const reaction of reactions) {
                                    await message.react(reaction);
                                }
                                logger.info('Applied changes to reaction message');
                            });
                        }
                    }
                });
            } else {
                logger.warn('Could not find role channel in cache on ready event');
            }
        } else {
            logger.warn('Could not find guild in cache on ready event');
        }

        // Load all active poll messages into the cache
        logger.debug('Loading all active polls into the cache', __filename);
        for (const poll of await getAllPolls()) {
            client.channels.fetch(poll.channelId).then(async channel => {
                await channel.messages.fetch(poll.messageId);
            });
        }

        logger.debug('Starting all loops', __filename);
        // Start wichtelLoop if needed
        await startWichtelLoop(client);
        // Start pollLoop
        await startPollLoop(client);
        // Start lavalinkLoop
        await startLavalinkLoop(client);
        // Start logLoop
        await startLogLoop();
    },
};