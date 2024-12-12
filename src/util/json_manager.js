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
 * Creates a new file with the specified initial data if it does not already exist at the given file path.
 *
 * @param {string} filePath - The path where the file should be created if it does not exist.
 * @param {object} initialData - The data to write to the file in JSON format if the file is created.
 * @return {void} This function does not return a value.
 */
function createFileIfNotExists(filePath, initialData) {
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
		try {
			logger.info(`Creating "${path.basename(filePath)}" file.`);
			fs.writeFileSync(filePath, JSON.stringify(initialData));
			logger.info(`Created "${path.basename(filePath)}" file.`);
		} catch (writeErr) {
			console.error(`Error creating file: ${writeErr}`);
		}
	}
}

/**
 * Reads a JSON file from the specified file path, parses its content, and returns it as a JavaScript object.
 *
 * @param {string} filePath - The path to the JSON file to be read.
 * @return {Object|null} The parsed JSON object, or null if an error occurs during reading or parsing.
 */
function readJsonFile(filePath) {
	try {
		const data = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(data);
	} catch (err) {
		logger.error(`Error reading or parsing JSON file: ${err}`);
		return null;
	}
}

/**
 * Handles the addition of a participant to the participants list by updating
 * their details if they exist, or adding them as a new participant if they do not.
 *
 * @param {Object} participantToJoin - The participant object containing the details of the participant.
 * @param {string} participantToJoin.id - The unique identifier for the participant.
 * @param {string} participantToJoin.dcName - The Discord name of the participant.
 * @param {string} participantToJoin.steamName - The Steam name of the participant.
 * @param {string} participantToJoin.steamFriendCode - The Steam friend code of the participant.
 * @return {void} This function does not return a value.
 */
function participantJoined(participantToJoin) {
	createFileIfNotExists(participantsPath, []);
	try {
		const jsonFile = readJsonFile(participantsPath);

		if (jsonFile === null) {
			logger.error('Error in participantJoined: JSON file is null.');
			return;
		}

		const existingParticipant = jsonFile.find(participant => participant.id === participantToJoin.id);

		if (existingParticipant) {
			existingParticipant.dcName = participantToJoin.dcName;
			existingParticipant.steamName = participantToJoin.steamName;
			existingParticipant.steamFriendCode = participantToJoin.steamFriendCode;
			existingParticipant.participates = true;
		} else {
			const newParticipant = {
				id: participantToJoin.id,
				dcName: participantToJoin.dcName,
				steamName: participantToJoin.steamName,
				steamFriendCode: participantToJoin.steamFriendCode,
				participates: true,
			};
			jsonFile.push(newParticipant);
		}

		fs.writeFileSync(participantsPath, JSON.stringify(jsonFile), 'utf-8');
		logger.info(`Updated participants.json. User "${participantToJoin.dcName}" joined.`);
	} catch (err) {
		logger.error(`Error in participantJoined: ${err}`);
	}
}

/**
 * Resets the participation status of all participants in the 'participants.json' file to false.
 * If the file does not exist, it is created as an empty array.
 *
 * @return {void} This function does not return a value.
 */
function resetParticipants() {
	createFileIfNotExists(participantsPath, []);
	try {
		const jsonFile = readJsonFile(participantsPath);

		if (jsonFile === null) {
			logger.error('Error in resetParticipants: JSON file is null.');
			return;
		}

		if (jsonFile.length > 0) {
			for (let i = 0; i < jsonFile.length; i++) {
				if (jsonFile[i].participates) {
					jsonFile[i].participates = false;
				}
			}
		}
		fs.writeFileSync(participantsPath, JSON.stringify(jsonFile), 'utf-8');
		logger.info('Reset participants.json.');
	} catch (err) {
		logger.error(`Error in participantJoined: ${err}`);
	}
}

/**
 * Retrieves a list of participants from a JSON file. Participants are filtered based on their participation status.
 * If an error occurs while reading the file or the file does not exist, an empty list is returned.
 * @return {Array} An array of participant objects who have their `participates` property set to true.
 */
function getParticipants() {
	createFileIfNotExists(participantsPath, []);
	try {
		const jsonFile = readJsonFile(participantsPath);

		if (jsonFile === null) {
			logger.error('Error in getParticipants: JSON file is null.');
			return [];
		}


		const participants = [];
		for (let i = 0; i < jsonFile.length; i++) {
			const participant = jsonFile[i];
			if (participant.participates) {
				participants.push(participant);
			}
		}
		return participants;
	}  catch (err) {
		logger.error(`Error in getParticipants: ${err}`);
		return [];
	}

}

/**
 * Updates the message ID associated with a specified key in a JSON file.
 *
 * This function ensures that the JSON file exists, reads the current contents,
 * updates the specified key with a new message ID, and writes the updated JSON
 * back to the file system. If the JSON file is initially null or an error
 * occurs during the update process, it logs an error message.
 *
 * @param {string} messageIdKey - The key in the JSON file whose value should be updated.
 * @param {string} messageID - The new message ID to associate with the specified key.
 * @return {void} This function does not return a value.
 */
function updateMessageID(messageIdKey, messageID) {
	createFileIfNotExists(messageIdPath, {
		role_id: '',
		wichtel_id: '',
	});

	try {
		const jsonFile = readJsonFile(messageIdPath);

		if (jsonFile === null) {
			logger.error('Error in updateMessageID: JSON file is null.');
			return;
		}

		jsonFile[messageIdKey] = messageID;

		fs.writeFileSync(messageIdPath, JSON.stringify(jsonFile));

		logger.info(`Updated messageID.json. ID of ${messageIdKey} message is now "${messageID}".`);
	} catch (err) {
		logger.error(`Error in updateMessageID: ${err}`);
	}
}

/**
 * Retrieves the message ID based on the specified type from a JSON file.
 * If the file does not exist, it will be created with default empty values.
 *
 * @param {string} type - The type of ID to retrieve, either 'role_id' or 'wichtel_id'.
 * @return {string} The requested message ID if found; an empty string if the type is invalid, or an error occurs.
 */
function getMessageID(type) {
	createFileIfNotExists(messageIdPath, {
		role_id: '',
		wichtel_id: '',
	});

	try {
		const jsonFile = readJsonFile(messageIdPath);

		if (jsonFile === null) {
			logger.error('Error in getMessageID: JSON file is null.');
			return '';
		}

		if (type === 'role_id') {
			return jsonFile.role_id;
		} else if (type === 'wichtel_id') {
			return jsonFile.wichtel_id;
		}
		return '';
	} catch (err) {
		logger.error(`Error in getMessageID: ${err}`);
		return '';
	}
}

/**
 * Sets the Wichtel data by writing to a specified file. The data includes whether
 * the Wichteln process is active, its end date, and associated time.
 *
 * @param {string} wichtelEnd - The end date for the Wichteln process.
 * @param {string} wichtelTime - The time associated with the Wichteln process.
 * @return {void} This function does not return a value.
 */
function setWichtelData(wichtelEnd, wichtelTime) {
	createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	try {
		const jsonFile = [
			{
				wichteln: true,
				end: wichtelEnd,
				time: wichtelTime,
			}
		];

		fs.writeFileSync(wichtelPath, JSON.stringify(jsonFile));
		logger.info(`Updated wichtel.json. Set wichtelData to ${wichtelEnd} and ${wichtelTime}.`);
	} catch (err) {
		logger.error(`Error in setWichtelData: ${err}`);
	}
}

/**
 * Resets the Wichtel data by creating or overwriting the Wichtel JSON file with default values.
 * The function ensures that the file has a default configuration with `wichteln` set to false,
 * and both `end` and `time` set to empty strings. If the file does not exist, it is created.
 * In case of any errors during the file write operation, an error message is logged.
 *
 * @return {void} This function does not return a value.
 */
function resetWichtelData() {
	createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	try {
		const jsonFile = [
			{
				wichteln: false,
				end: '',
				time: '',
			}
		];

		fs.writeFileSync(wichtelPath, JSON.stringify(jsonFile));
		logger.info('Updated wichtel.json. Reset wichtelData.');
	} catch (err) {
		logger.error(`Error in resetWichtelData: ${err}`);
	}
}

/**
 * Retrieves the 'wichteln' status from a JSON file.
 * If the file doesn't exist, it is created with default values.
 * Logs an error and returns false if the JSON file is null or if there is an error during the process.
 *
 * @return {boolean} The 'wichteln' status from the JSON file or false if there is an error or if the file is null.
 */
function getWichteln() {
	createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	try {
		const jsonFile = readJsonFile(wichtelPath);

		if (jsonFile === null) {
			logger.error('Error in getWichteln: JSON file is null.');
			return false;
		}

		return jsonFile[0] ? jsonFile[0].wichteln : false;
	} catch (err) {
		logger.error(`Error in getWichteln: ${err}`);
		return false;
	}


}

/**
 * Retrieves the end date of the "Wichtel" event from a JSON file.
 * If the file does not exist, it creates a default file structure.
 * If an error occurs during file reading or parsing, it logs the error and returns an empty string.
 *
 * @return {string} The end date of the "Wichtel" event. Returns an empty string if the date cannot be retrieved.
 */
function getWichtelEnd() {
	createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	try {
		const jsonFile = readJsonFile(wichtelPath);

		if (jsonFile === null) {
			logger.error('Error in getWichtelEnd: JSON file is null.');
			return '';
		}

		return jsonFile[0] ? jsonFile[0].end : '';
	} catch (err) {
		logger.error(`Error in getWichtelEnd: ${err}`);
		return '';
	}
}

/**
 * Retrieves the wichtel time from a JSON file located at a predefined path.
 * If the JSON file does not exist, it creates the file with default data.
 * Returns the time associated with the first element in the JSON array.
 * Log an error if the JSON file is null or if an error occurs during retrieval.
 *
 * @return {string} The wichtel time from the JSON file, or an empty string if the file is null or an error occurs.
 */
function getWichtelTime() {
	createFileIfNotExists(wichtelPath, [
		{
			wichteln: false,
			end: '',
			time: '',
		}
	]);

	try {
		const jsonFile = readJsonFile(wichtelPath);

		if (jsonFile === null) {
			logger.error('Error in getWichtelTime: JSON file is null.');
			return '';
		}

		return jsonFile[0] ? jsonFile[0].time : '';
	} catch (err) {
		logger.error(`Error in getWichtelTime: ${err}`);
		return '';
	}
}

/**
 * Checks for polls that have ended by comparing the current time with the poll's end time.
 * Removes ended polls from the stored poll data and updates the storage.
 * Logs information and errors during the process.
 *
 * @return {Array} Returns an array of polls that have ended and were removed. Returns an empty array if no polls have ended or if an error occurs.
 */
function checkPollsEnd() {
	createFileIfNotExists(pollPath, []);

	try {
		const jsonFile = readJsonFile(pollPath);

		if (jsonFile === null) {
			logger.error('Error in checkPollsEnd: JSON file is null.');
			return [];
		}

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

		fs.writeFileSync(pollPath, JSON.stringify(jsonFile));

		if (toRemove.length > 0) {
			logger.info('Updated poll.json. Removed old polls');
		}

		return toRemove;

	} catch (err) {
		logger.error(`Error in checkPollsEnd: ${err}`);
		return [];
	}
}

/**
 * Adds a new poll to the polls' data file. The poll is defined by its unique identifiers,
 * expiration time, and the maximum number of votes allowed.
 *
 * @param {string} messageId - The unique identifier for the poll message.
 * @param {string} channelId - The unique identifier for the channel where the poll is posted.
 * @param {Date} endTime - The time when the poll will end.
 * @param {number} max_votes - The maximum number of votes allowed for the poll.
 * @return {void} This function does not return a value.
 */
function addPoll(messageId, channelId, endTime, max_votes) {
	createFileIfNotExists(pollPath, []);

	try {
		const jsonFile = readJsonFile(pollPath);

		if (jsonFile === null) {
			logger.error('Error in addPoll: JSON file is null.');
			return;
		}

		const newPoll = {
			messageId: messageId,
			channelId: channelId,
			endTime: endTime,
			max_votes: max_votes
		};

		jsonFile.push(newPoll);

		fs.writeFileSync(pollPath, JSON.stringify(jsonFile));
		logger.info(`Updated poll.json. Added poll ${messageId} with end time ${endTime} and max votes ${max_votes}.`);
	} catch (err) {
		logger.error(`Error in addPoll: ${err}`);
	}
}

/**
 * Retrieves the list of polls from the JSON file located at the specified path.
 * If the file does not exist, it is created with an empty array.
 * If any error occurs during reading or parsing the file, it returns an empty array
 * and logs the error.
 *
 * @return {Array} The array of polls retrieved from the JSON file, or an empty array in case of an error.
 */
function getPolls() {
	createFileIfNotExists(pollPath, []);

	try {
		const jsonFile = readJsonFile(pollPath);

		if (jsonFile === null) {
			logger.error('Error in getPolls: JSON file is null.');
			return [];
		}

		return jsonFile;
	} catch (err) {
		logger.error(`Error in getPolls: ${err}`);
		return [];
	}
}

/**
 * Retrieves a poll object associated with the given messageId from the JSON file located at pollPath.
 *
 * @param {string} messageId - The unique identifier for the poll message to be retrieved.
 * @return {Object|null} The poll object if found; otherwise, null if not found. Returns an empty array in case of an error reading the file.
 */
function getPoll(messageId) {
	createFileIfNotExists(pollPath, []);

	try {
		const jsonFile = readJsonFile(pollPath);

		if (jsonFile === null) {
			logger.error('Error in getPoll: JSON file is null.');
			return null;
		}

		const poll = jsonFile.find(poll => poll.messageId === messageId);
		return poll || null;
	} catch (err) {
		logger.error(`Error in getPoll: ${err}`);
		return [];
	}
}


module.exports = { participantJoined, resetParticipants, getParticipants, updateMessageID, getMessageID,
	setWichtelData, resetWichtelData, getWichteln, getWichtelEnd, getWichtelTime,
	checkPollsEnd, addPoll, getPolls, getPoll };