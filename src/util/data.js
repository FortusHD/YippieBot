// Imports
const logger = require('../logging/logger');

// Prisoner stuff
let prisoners = [];

function addPrisoner(id) {
    prisoners.push(id);
    logger.debug(`Added prisoner ${id} to prisoners list. Prisoner list: [${prisoners.join(', ')}]`, __filename);
}

function removePrisoner(id) {
    prisoners = prisoners.filter(function (value) {
        return value !== id;
    });
    logger.debug(`Removed prisoner ${id} from prisoners list. Prisoner list: [${prisoners.join(', ')}]`,
        __filename);
}

function isPrisoner(id) {
    return prisoners.includes(id);
}

module.exports = { addPrisoner, removePrisoner, isPrisoner };