// Imports
const { Events, GatewayDispatchEvents } = require('discord.js');
const logger = require('../logging/logger');

// Updates the voice state for the riffy client when the voice state of this bot is updated
module.exports = {
    name: Events.Raw,
    // discord.js emits the raw event with (packet, shardId); main.js appends the client as last argument
    async execute(d, ...args) {
        if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) {
            return;
        }
        const client = args[args.length - 1];

        logger.debug(`Received raw event: ${d.t}`, __filename);
        client.riffy.updateVoiceState(d);
    },
};