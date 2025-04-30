// Prisoner stuff
let prisoners = [];

function addPrisoner(id) {
    prisoners.push(id);
}

function removePrisoner(id) {
    prisoners = prisoners.filter(function (value) {
        return value !== id;
    });
}

function isPrisoner(id) {
    return prisoners.includes(id);
}

module.exports = { addPrisoner, removePrisoner, isPrisoner };