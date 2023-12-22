// Prisoner stuff
let prisoners = [];
let wichtelTime = '29.12.2023 um 14:00 Uhr';

function addPrisoner(id) {
	prisoners.push(id);
}

function removePrisoner(id) {
	prisoners = prisoners.filter(function(value) {
		return value !== id;
	});
}

function isPrisoner(id) {
	return prisoners.includes(id);
}

function setWichtelTime(newWichtelTime) {
	wichtelTime = newWichtelTime;
}

module.exports = { addPrisoner, removePrisoner, isPrisoner, wichtelTime, setWichtelTime };