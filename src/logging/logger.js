const date = require('date-and-time');
const fs = require('fs');

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	fg: {
		black: '\x1b[30m',
		red: '\x1b[31m',
		green: '\x1b[32m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		magenta: '\x1b[35m',
		cyan: '\x1b[36m',
		white: '\x1b[37m',
		gray: '\x1b[90m',
		crimson: '\x1b[38m',
	},
	bg: {
		black: '\x1b[40m',
		red: '\x1b[41m',
		green: '\x1b[42m',
		yellow: '\x1b[43m',
		blue: '\x1b[44m',
		magenta: '\x1b[45m',
		cyan: '\x1b[46m',
		white: '\x1b[47m',
		gray: '\x1b[100m',
		crimson: '\x1b[48m',
	},
};

function getNow() {
	const now = new Date();
	return date.format(now, 'DD.MM.YYYY, HH:mm:ss');
}

function getLogPath() {
	const now = new Date();
	return `./logs/${date.format(now, 'YYYY-MM-DD')}.log`;
}

function writeLog(text) {
	fs.appendFile(getLogPath(), `${text}\n`, err => {
		if (err) {
			console.error(`${colors.fg.red}[ERROR] [${getNow()}] ${err}${colors.reset}`);
		}
	});
}

function log(text, color) {
	console.log(`${color}[${getNow()}] ${text}${colors.reset}`);
	writeLog(`[${getNow()}] ${text}`);
}

function info(text) {
	console.info(`${colors.fg.green}[INFO] [${getNow()}] ${text}${colors.reset}`);
	writeLog(`[INFO] [${getNow()}] ${text}`);
}

function warn(text) {
	console.warn(`${colors.fg.yellow}[WARNING] [${getNow()}] ${text}${colors.reset}`);
	writeLog(`[WARNING] [${getNow()}] ${text}`);
}

function error(text, source) {
	console.error(`${colors.fg.red}[ERROR] [${getNow()}] ${text} at ${source}${colors.reset}`);
	writeLog(`[ERROR] [${getNow()}] ${text}`);
}

module.exports = { colors, log, info, warn, error };