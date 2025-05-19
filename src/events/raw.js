// Imports
const { Events, GatewayDispatchEvents } = require('discord.js');
const client = require('../main/main');
const logger = require('../logging/logger');

// Updates the voice state for the riffy client when the voice state of this bot is updated
module.exports = {
    name: Events.Raw,
    async execute(d) {
        if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) {
            return;
        }
        logger.debug(`Received raw event: ${d.t}`, __filename);
        client.riffy.updateVoiceState(d);
    },
};