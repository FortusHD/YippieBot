// Imports
const fs = require('fs');
const path = require('node:path');
const logger = require('../logging/logger.js');

const participantsPath = path.join(__dirname, '../../data/participants.json');
const messageIdPath = path.join(__dirname, '../../data/messageID.json');

// Creates the participants file
async function createParticipantsFile() {
	return new Promise(function(resolve, reject) {
		fs.open(participantsPath, 'r', function(err) {
			if (err) {
				logger.info('Creating "participants.json" file.');

				const participants = [];

				fs.writeFileSync(participantsPath, JSON.stringify(participants), function(err) {
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

// Adds participant (or changes participates to true, if participant already exists)
async function participantJoined(participantToJoin) {
	await createParticipantsFile();

	fs.readFile(participantsPath, 'utf-8', (err, data) => {
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

		fs.writeFile(participantsPath, JSON.stringify(jsonFile), err => {
			if (err) {
				logger.error(err, __filename);
				return;
			}
			logger.info(`Updated participants.json. User "${participantToJoin.dcName}" joined.`);
		});
	});
}

// Sets participates for all participants to false
async function resetParticipants() {
	await createParticipantsFile();

	fs.readFile(participantsPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
		}

		if (JSON.parse(data) !== undefined && JSON.parse(data).participants) {
			const jsonFile = JSON.parse(data).participants.map(participant => participant.participates = false);

			fs.writeFile(participantsPath, JSON.stringify(jsonFile), err => {
				if (err) {
					logger.error(err, __filename);
				}
			});
		}

		logger.info('Reset participants.json.');
	});
}

// Returns a list of all participants
async function getParticipants() {
	return await createParticipantsFile().then(() => {
		const participants = [];

		const data = fs.readFileSync(participantsPath, 'utf-8');
		const jsonFile = JSON.parse(data);

		for (let i = 0; i < jsonFile.length; i++) {
			if (jsonFile[i].participates) {
				participants.push(jsonFile[i]);
			}
		}

		return participants;
	});
}

// Creates the messageID file
async function createMessageIdFile() {
	return new Promise(function(resolve, reject) {
		fs.open(messageIdPath, 'r', function(err) {
			if (err) {
				logger.info('Creating "messageID.json" file.');

				const messageID = {
					role_id: '',
					wichtel_id: '',
				};

				fs.writeFileSync(messageIdPath, JSON.stringify(messageID), function(err) {
					logger.log(err, logger.colors.fg.red);
					if (err) {
						logger.error(err, __filename);
						reject();
					}
				});
				logger.info('Created "messageID.json" file.');
				resolve();
			}

			resolve();
		});
	});
}

// Updates id of reaction role message
async function updateMessageID(type, messageID) {
	await createMessageIdFile();

	fs.readFile(messageIdPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
		}

		const jsonFile = JSON.parse(data);

		if (type === 'role_id') {
			jsonFile.role_id = messageID;
		} else if (type === 'wichtel_id') {
			jsonFile.wichtel_id = messageID;
		}

		fs.writeFile(messageIdPath, JSON.stringify(jsonFile), err => {
			if (err) {
				logger.error(err, __filename);
				return;
			}
			logger.info(`Updated messageID.json. ID of reaction role message is now "${messageID}".`);
		});
	});
}

// Returns id of current reaction role message
async function getMessageID(type) {
	return await createMessageIdFile().then(() => {
		const data = fs.readFileSync(messageIdPath, 'utf-8');

		if (type === 'role_id') {
			return JSON.parse(data).role_id;
		} else if (type === 'wichtel_id') {
			return JSON.parse(data).wichtel_id;
		}

		return '';
	});
}

module.exports = { participantJoined, resetParticipants, getParticipants, updateMessageID, getMessageID };