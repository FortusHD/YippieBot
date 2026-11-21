// Imports
const logger = require('../logging/logger');

// Prisoner stuff (only kept in memory on purpose, the list is allowed to be reset by a restart)
const prisoners = new Set();

function addPrisoner(id) {
    prisoners.add(id);
    logger.debug(`Added prisoner ${id} to prisoners list. Prisoner list: [${[...prisoners].join(', ')}]`,
        __filename);
}

function removePrisoner(id) {
    prisoners.delete(id);
    logger.debug(`Removed prisoner ${id} from prisoners list. Prisoner list: [${[...prisoners].join(', ')}]`,
        __filename);
}

function isPrisoner(id) {
    return prisoners.has(id);
}

module.exports = { addPrisoner, removePrisoner, isPrisoner };
