// Imports
const fs = require('fs');
const path = require('node:path');
const logger = require('../logging/logger.js');

// File Paths
const participantsPath = path.join(__dirname, '../../data/participants.json');
const messageIdPath = path.join(__dirname, '../../data/messageID.json');
const wichtelPath = path.join(__dirname, '../../data/wichtel.json');
const pollPath = path.join(__dirname, '../../data/poll.json');

/**
 * Creates a file if it doesn't exist.
 * @param {string} filePath - The path to the file.
 * @param {any} initialData - The initial data to write to the file if it's created.
 * @return {Promise<void>}
 */
async function createFileIfNotExists(filePath, initialData) {
	return new Promise((resolve, reject) => {
		fs.access(filePath, fs.constants.F_OK, err => {
			if (err) {
				logger.info(`Creating "${path.basename(filePath)}" file.`);
				fs.writeFile(filePath, JSON.stringify(initialData), err => {
					if (err) {
						logger.error(err, __filename);
						reject(err);
					} else {
						logger.info(`Created "${path.basename(filePath)}" file.`);
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	});
}

/**
 * Reads a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @return {Promise<any>} - A promise that resolves to the parsed JSON object.
 */
async function readJsonFile(filePath) {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, 'utf-8', (err, data) => {
			if (err) {
				logger.error(err, __filename);
				reject(err);
			} else {
				try {
					const jsonData = JSON.parse(data);
					resolve(jsonData);
				} catch (parseError) {
					logger.error('Error parsing JSON:', parseError, __filename);
					reject(parseError);
				}
			}
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
	await createFileIfNotExists(participantsPath, []);
	try {
		const jsonFile = await readJsonFile(participantsPath);
		const existingParticipant = jsonFile.find(participant => participant.id === participantToJoin.id);

		if (existingParticipant) {
			existingParticipant.participates = true;
		} else {
			const newParticipant = {
				dcName: participantToJoin.dcName,
				steamName: participantToJoin.steamName,
				id: participantToJoin.id,
				participates: true,
			};
			jsonFile.push(newParticipant);
		}

		await fs.promises.writeFile(participantsPath, JSON.stringify(jsonFile));
		logger.info(`Updated participants.json. User "${participantToJoin.dcName}" joined.`);

	} catch (error) {
		// Handle errors appropriately
		console.error('Error in participantJoined:', error);
	}
}

/**
 * Resets the participation status of all participants in the participants file.
 * Reads the participants data, sets the 'participates' field to false for each participant,
 * and writes the updated data back to the file. Logs an informational message after completion.
 *
 * @return {Promise<void>} A promise that resolves when the operation is complete.
 */
async function resetParticipants() {
	await createFileIfNotExists(participantsPath, []);
	const jsonFile = await readJsonFile(participantsPath);
	if (jsonFile.length > 0) {
		for (let i = 0; i < jsonFile.length; i++) {
			if (jsonFile[i].participates) {
				jsonFile[i].participates = false;
			}
		}
	}
	await fs.promises.writeFile(participantsPath, JSON.stringify(jsonFile));
	logger.info('Reset participants.json.');
}

/**
 * Retrieves a list of participants from a file.
 * The file is read synchronously and parsed as JSON.
 * Only entries marked as participating are included in the returned list.
 *
 * @return {Promise<Array<Object>>} A promise that resolves to an array of participant objects.
 */
async function getParticipants() {
	await createFileIfNotExists(participantsPath, []);
	const jsonFile = await readJsonFile(participantsPath);
	const participants = [];
	for (let i = 0; i < jsonFile.length; i++) {
		const participant = jsonFile[i];
		if (participant.participates) {
			participants.push(participant);
		}
	}
	return participants;
}

/**
 * Updates the message ID in the specified JSON file by the given key.
 *
 * @param {string} messageIdKey - The key representing the message ID to update.
 * @param {string} messageID - The new message ID to store.
 * @return {Promise<void>} A promise that resolves when the message ID has been updated.
 */
async function updateMessageID(messageIdKey, messageID) {
	try {
		await createFileIfNotExists(messageIdPath, {
			role_id: '',
			wichtel_id: '',
		});

		const data = await fs.promises.readFile(messageIdPath, 'utf-8');
		const jsonFile = JSON.parse(data);

		jsonFile[messageIdKey] = messageID;

		await fs.promises.writeFile(messageIdPath, JSON.stringify(jsonFile));

		logger.info(`Updated messageID.json. ID of ${messageIdKey} message is now "${messageID}".`);
	} catch (err) {
		logger.error(err, __filename);
	}
}

/**
 * Retrieves a message ID based on the specified type from a file.
 *
 * @param {string} type - The type of message ID to retrieve. Valid values are 'role_id' or 'wichtel_id'.
 * @return {Promise<string>} A promise that resolves to the requested message ID, or an empty string if the type is invalid.
 */
async function getMessageID(type) {
	await createFileIfNotExists(messageIdPath, {
		role_id: '',
		wichtel_id: '',
	});

	const data = await fs.promises.readFile(messageIdPath, 'utf-8');
	const jsonData = JSON.parse(data);
	if (type === 'role_id') {
		return jsonData.role_id;
	} else if (type === 'wichtel_id') {
		return jsonData.wichtel_id;
	}
	return '';
}

/**
 * Asynchronously sets the wichtel data by updating the wichtel.json file with the provided end and time values.
 *
 * @param {string} wichtelEnd - The completion date for the wichtel.
 * @param {string} wichtelTime - The timestamp for the wichtel operation.
 * @return {Promise<void>} A promise that resolves when the wichtel data has been set.
 */
async function setWichtelData(wichtelEnd, wichtelTime) {
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

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
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

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
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

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
async function getWichteln() {
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	const data = fs.readFileSync(wichtelPath, 'utf-8');
	const jsonFile = JSON.parse(data);
	return jsonFile[0] ? jsonFile[0].wichteln : false;
}

/**
 * Retrieves the "end" value from the first element of a JSON file.
 *
 * @return {Promise<string>} A promise that resolves to the "end" value.
 */
async function getWichtelEnd() {
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	const data = fs.readFileSync(wichtelPath, 'utf-8');
	const jsonFile = JSON.parse(data);
	return jsonFile[0] ? jsonFile[0].end : '';
}

/**
 * Retrieves the "Wichtel" time from a specific JSON file.
 * It first ensures the file is created, if it does not already exist,
 * then reads and parses the file to extract the time value.
 *
 * @return {Promise<string>} A promise that resolves to the "Wichtel" time as a string.
 */
async function getWichtelTime() {
	await createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	const data = fs.readFileSync(wichtelPath, 'utf-8');
	const jsonFile = JSON.parse(data);
	return jsonFile[0] ? jsonFile[0].time : '';
}

/**
 * Checks the polls stored in a file and removes any that have ended.
 *
 * This method reads from a JSON file containing poll data, determines which polls have ended based on the current time,
 * removes those polls from the data, and writes the updated data back to the file.
 *
 * @return {Promise<Array>} A promise that resolves to an array of removed polls. If an error occurs, an empty array is returned.
 */
async function checkPollsEnd() {
	await createFileIfNotExists(pollPath, []);

	try {
		const data = await fs.promises.readFile(pollPath, 'utf-8');
		const jsonFile = JSON.parse(data);
		const toRemove = [];

		jsonFile.forEach(poll => {
			const date = new Date();
			date.setSeconds(0, 0);
			const unixNow = Math.floor(date.getTime() / 1000);
			if (unixNow >= poll.endTime) {
				toRemove.push(poll);
			}
		});

		toRemove.forEach(oldPoll => {
			const index = jsonFile.findIndex(Poll => Poll.messageId === oldPoll.messageId);
			jsonFile.splice(index, 1);
		});

		await fs.promises.writeFile(pollPath, JSON.stringify(jsonFile));

		if (toRemove.length > 0) {
			logger.info('Updated poll.json. Removed old polls');
		}

		return toRemove;

	} catch (err) {
		logger.error(err, __filename);
		return [];
	}
}

/**
 * Adds a new poll to the poll file.
 *
 * @param {string} messageId - The ID of the message associated with the poll.
 * @param {string} channelId - The ID of the channel where the poll is created.
 * @param {Date} endTime - The end time of the poll.
 * @param {number} max_votes - The maximum number of votes allowed for the poll.
 * @return {Promise<void>} A promise that resolves when the poll is successfully added.
 */
async function addPoll(messageId, channelId, endTime, max_votes) {
	await createFileIfNotExists(pollPath, []);

	fs.readFile(pollPath, 'utf-8', (err, data) => {
		if (err) {
			logger.error(err, __filename);
			return;
		}

		const jsonFile = JSON.parse(data);

		const newPoll = {
			messageId: messageId,
			channelId: channelId,
			endTime: endTime,
			max_votes: max_votes
		};

		jsonFile.push(newPoll);

		fs.writeFile(pollPath, JSON.stringify(jsonFile), err => {
			if (err) {
				logger.error(err, __filename);
				return;
			}
			logger.info(`Updated poll.json. Added poll ${messageId} with end time ${endTime} and max votes ${max_votes}.`);
		});
	});
}

/**
 * Retrieves poll data from a file.
 *
 * @return {Promise<Array>} A promise that resolves to an array of poll data read from the file.
 */
async function getPolls() {
	await createFileIfNotExists(pollPath, []);

	const data = fs.readFileSync(pollPath, 'utf-8');

	return JSON.parse(data);
}

/**
 * Retrieves a poll object based on the provided messageId.
 *
 * @param {string} messageId - The unique identifier for the poll message.
 * @return {Promise<Object|null>} - A promise that resolves to the poll object if found, or null if not.
 */
async function getPoll(messageId) {
	await createFileIfNotExists(pollPath, []);

	const data = fs.readFileSync(pollPath, 'utf-8');

	const jsonFile = JSON.parse(data);

	const poll = jsonFile.find(poll => poll.messageId === messageId);

	return poll || null;
}


module.exports = { participantJoined, resetParticipants, getParticipants, updateMessageID, getMessageID,
	setWichtelData, setWichtelnFalse, resetWichtelData, getWichteln, getWichtelEnd, getWichtelTime,
	checkPollsEnd, addPoll, getPolls, getPoll };