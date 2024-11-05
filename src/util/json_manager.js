// Imports
const fs = require('fs');
const path = require('node:path');
const logger = require('../logging/logger.js');

const participantsPath = path.join(__dirname, '../../data/participants.json');
const messageIdPath = path.join(__dirname, '../../data/messageID.json');
const wichtelPath = path.join(__dirname, '../../data/wichtel.json');

/**
 * Creates a file named "participants.json" if it does not already exist.
 * The file will be initialized with an empty array. The method returns
 * a promise that resolves upon successful creation or if the file already exists.
 * Any errors during the file operation will be logged.
 *
 * @return {Promise<void>} A promise that resolves when the operation completes.
 */
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

/**
 * Handles the process of adding a new participant or updating the participation status
 * of an existing participant in the participants list.
 *
 * @param {Object} participantToJoin - The participant object containing details of the user joining.
 * @param {string} participantToJoin.dcName - The Discord name of the participant.
 * @param {string} participantToJoin.steamName - The Steam name of the participant.
 * @param {string} participantToJoin.id - The unique identifier of the participant.
 * @return {Promise<void>} - A promise that resolves when the participant has been added or updated.
 */
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

/**
 * Resets the participation status of all participants in the participants file.
 * Reads the participants data, sets the 'participates' field to false for each participant,
 * and writes the updated data back to the file. Logs an informational message after completion.
 *
 * @return {Promise<void>} A promise that resolves when the operation is complete.
 */
function resetParticipants() {
	createParticipantsFile().then(() => {
		const data = fs.readFileSync(participantsPath, 'utf-8');

		let jsonFile = JSON.parse(data);

		if (jsonFile.length > 0) {
			jsonFile = jsonFile.map(participant => participant.participates === true ? {
				...participant,
				participates: false,
			} : participant);
		}

		fs.writeFileSync(participantsPath, JSON.stringify(jsonFile));

		logger.info('Reset participants.json.');
	});
}

/**
 * Retrieves a list of participants from a file.
 * The file is read synchronously and parsed as JSON.
 * Only entries marked as participating are included in the returned list.
 *
 * @return {Promise<Array<Object>>} A promise that resolves to an array of participant objects.
 */
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

/**
 * Creates a "messageID.json" file in the specified messageIdPath if it does not already exist.
 * The file contains an initial JSON object with default values for 'role_id' and 'wichtel_id'.
 *
 * @return {Promise<void>} A promise that resolves if the file is successfully created or already exists; rejects if an error occurs during file creation.
 */
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

/**
 * Updates the message ID in the JSON file based on the specified type.
 *
 * @param {string} type - The type of message ID to update ('role_id' or 'wichtel_id').
 * @param {string} messageID - The new message ID to be saved.
 * @return {Promise<void>} A promise that resolves when the message ID has been updated.
 */
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
			logger.info(`Updated messageID.json. ID of ${type} message is now "${messageID}".`);
		});
	});
}

/**
 * Retrieves a message ID based on the specified type from a file.
 *
 * @param {string} type - The type of message ID to retrieve. Valid values are 'role_id' or 'wichtel_id'.
 * @return {Promise<string>} A promise that resolves to the requested message ID, or an empty string if the type is invalid.
 */
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

/**
 * Creates the "wichtel.json" file if it does not exist.
 *
 * @return {Promise<void>} A promise that resolves when the file creation is complete or if the file already exists.
 */
async function createWichtelFile() {
	return new Promise(function(resolve, reject) {
		fs.open(wichtelPath, 'r', function(err) {
			if (err) {
				logger.info('Creating "wichtel.json" file.');

				const data = [
					{
						wichteln: false,
						end: '',
						time: '',
					}
				];

				fs.writeFileSync(wichtelPath, JSON.stringify(data), function(err) {
					logger.log(err, logger.colors.fg.red);
					if (err) {
						logger.error(err, __filename);
						reject();
					}
				});
				logger.info('Created "wichtel.json" file.');
				resolve();
			}

			resolve();
		});
	});
}

/**
 * Asynchronously sets the wichtel data by updating the wichtel.json file with the provided end and time values.
 *
 * @param {string} wichtelEnd - The completion date for the wichtel.
 * @param {string} wichtelTime - The timestamp for the wichtel operation.
 * @return {Promise<void>} A promise that resolves when the wichtel data has been set.
 */
async function setWichtelData(wichtelEnd, wichtelTime) {
	await createWichtelFile();

	const jsonFile = [
		{
			wichteln: true,
			end: wichtelEnd,
			time: wichtelTime,
		}
	];

	fs.writeFile(wichtelPath, JSON.stringify(jsonFile), err => {
		if (err) {
			logger.error(err, __filename);
			return;
		}
		logger.info(`Updated wichtel.json. Set wichtelData to ${wichtelEnd} and ${wichtelTime}.`);
	});
}

/**
 * Ends the "Wichteln" activity by updating the wichtel file to set the
 * wichteln property to false.
 *
 * @return {Promise<void>} A promise that resolves once the wichtel file has been updated.
 */
async function setWichtelnFalse() {
	await createWichtelFile();

	const data = fs.readFileSync(wichtelPath, 'utf-8');
	const jsonFile = JSON.parse(data);
	jsonFile[0].wichteln = false;

	fs.writeFile(wichtelPath, JSON.stringify(jsonFile), err => {
		if (err) {
			logger.error(err, __filename);
			return;
		}
		logger.info('Updated wichtel.json. Set wichtelData to false.');
	});
}

async function resetWichtelData() {
	await createWichtelFile();

	const jsonFile = [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	];

	fs.writeFile(wichtelPath, JSON.stringify(jsonFile), err => {
		if (err) {
			logger.error(err, __filename);
			return;
		}
		logger.info('Updated wichtel.json. Reset wichtelData.');
	});
}

/**
 * Retrieves the "wichteln" property from the first entry of the JSON data
 * contained in a file specified by a path.
 *
 * @return {Promise<any>} A promise that resolves to the "wichteln" property.
 */
function getWichteln() {
	return createWichtelFile().then(() => {
		const data = fs.readFileSync(wichtelPath, 'utf-8');
		const jsonFile = JSON.parse(data);
		return jsonFile[0] ? jsonFile[0].wichteln : false;
	});
}

/**
 * Retrieves the "end" value from the first element of a JSON file.
 *
 * @return {Promise<string>} A promise that resolves to the "end" value.
 */
function getWichtelEnd() {
	return createWichtelFile().then(() => {
		const data = fs.readFileSync(wichtelPath, 'utf-8');
		const jsonFile = JSON.parse(data);
		return jsonFile[0] ? jsonFile[0].end : '';
	});
}

/**
 * Retrieves the "Wichtel" time from a specific JSON file.
 * It first ensures the file is created, if it does not already exist,
 * then reads and parses the file to extract the time value.
 *
 * @return {Promise<string>} A promise that resolves to the "Wichtel" time as a string.
 */
function getWichtelTime() {
	return createWichtelFile().then(() => {
		const data = fs.readFileSync(wichtelPath, 'utf-8');
		const jsonFile = JSON.parse(data);
		return jsonFile[0] ? jsonFile[0].time : '';
	});
}


module.exports = { participantJoined, resetParticipants, getParticipants, updateMessageID, getMessageID,
	setWichtelData, setWichtelnFalse, resetWichtelData, getWichteln, getWichtelEnd, getWichtelTime };