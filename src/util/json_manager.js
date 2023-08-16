const fs = require('fs');
const path = require('node:path');
const logger = require('../logging/logger.js');

const jsonPath = path.join(__dirname, '../files/participants.json');

async function creatFileIfNotExists() {
	return new Promise(function(resolve, reject) {
		fs.open(jsonPath, 'r', function(err) {
			if (err) {
				logger.info('Creating "participants.json" file.');

				const participants = [];

				fs.writeFileSync(jsonPath, JSON.stringify(participants), function(err) {
					logger.log(err, logger.colors.fg.red);
					if (err) {
						logger.error(err, __filename);
						reject();
					}
				});
				logger.info('Created "participants.json" file.');
				resolve();
			}

			resolve();
		});
	});
}

async function participantJoined(participantToJoin) {
	await creatFileIfNotExists();

	fs.readFile(jsonPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
			return;
		}

		const jsonFile = JSON.parse(data);

		let found = false;

		jsonFile.forEach(participant => {
			if (participant.id === participantToJoin.id) {
				found = true;
				participant.participates = true;
			}
		});

		if (!found) {
			const newParticipant = {
				dcName: participantToJoin.dcName,
				steamName: participantToJoin.steamName,
				id: participantToJoin.id,
				participates: true,
			};

			jsonFile.push(newParticipant);
		}

		fs.writeFile(jsonPath, JSON.stringify(jsonFile), err => {
			if (err) {
				logger.error(err, __filename);
				return;
			}
			logger.info(`Updated participants.json. User "${participantToJoin.dcName}" joined.`);
		});
	});
}

async function resetParticipants() {
	await creatFileIfNotExists();

	fs.readFile(jsonPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
		}

		const jsonFile = JSON.parse(data).participants.map(participant => participant.participates = false);

		fs.writeFile(jsonPath, JSON.stringify(jsonFile), err => {
			if (err) {
				logger.error(err, __filename);
				return;
			}
			logger.info('Reset participants.json.');
		});
	});
}

async function getParticipants() {
	const participants = [];

	await creatFileIfNotExists();

	fs.readFile(jsonPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
		}

		const jsonFile = JSON.parse(data);

		jsonFile.forEach(participant => { if (participant.participates) participants.push(participant); });
	});

	return participants;
}

module.exports = { participantJoined, resetParticipants, getParticipants };