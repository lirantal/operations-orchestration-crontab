'use strict'
/**
 * operations-orchestration-crontab
 * @module operations-orchestration-crontab
 */

var OO 				= require('operations-orchestration-api');
var commandLineArgs = require('command-line-args');
var jsonfile 		= require('jsonfile');
var chalk			= require('chalk');
var fs 				= require('fs');
var byline 			= require('byline');
var C2Q				= require('cron-to-quartz');
var chalk			= require('chalk');
var util			= require('util');														
var rl              = require('readline');

var options = {
	username: 'admin',
	password: 'admin',
	baseUrl: 'http://localhost:8050'
};

/**
 * get module package information
 * 
 * @method	getPackageInfo
 * @return	{string}		package information as a sring
 */
function getPackageInfo() {

	var pkg = require('./package.json');

	var str = '';
	str += pkg.name + "\n";
	str += 'version: ' + pkg.version + ' by ' + pkg.author.name + "\n";
	return str;
}

/**
 * prints out command line usage information and exit with an error code
 * 
 * @method	cliShowUsage
 * @param 	{string}	command line arguments usage help
 * @param 	{string}	the error message to print to the screen
 */
function cliShowUsage(cliUsage, msg) {

	console.log(chalk.red(Error(msg)));
	console.error(cliUsage);
	process.exit(1);
}

/**
 * prints out an error message
 * 
 * @method	cliExitError
 * @param 	{string}	the error message to print on the screen
 */
function cliExitError(msg) {

	console.log();
	console.log(chalk.red(msg));
	process.exit(1);
}

/**
 * prints out a success message
 * 
 * @method	cliExitClean
 * @param 	{string}	a success message text to print to the screen
 */
function cliExitClean(msg) {

	console.log(chalk.green(msg));
	process.exit(0);
}

/**
 * parse command line arguments to set the options for connecting to OO 
 * 
 * @method	cliCheck
 * @return	{object}		return the object with the passed parameters to the command line
 */
function cliCheck() {

	var cli = commandLineArgs([
	  { name: 'username', alias: 'u', type: String, description: 'Username for Operations Orchestration that is allowed to query the API' },
	  { name: 'password', alias: 'p', type: String, description: 'Password for the Username provided' },
	  { name: 'url', type: String, description: 'The URL where Operations Orchestration API is available. Example: http://localhost:8050' },
	  { name: 'remotehost', type: String, description: 'The remote host to connect to via SSH and execute the cron commands'},
	  { name: 'remoteport', type: String, description: 'The remote port to connect to via SSH'},
	  { name: 'remoteuser', type: String, description: 'The remote username to connect to via SSH'},
	  { name: 'remotepass', type: String, description: 'The remote password to connect to via SSH'},
	  { name: 'crontab', type: String, description: 'A local CRONTAB compatible filename to read and parse for creating OO scheduled flows' },
	]);

	var cliOptions = cli.parse();
	var cliUsage = cli.getUsage();

	var remoteDetailsErrorMsg = 'must provide option of %s to specify the remote host to connect to via SSH and run the scheduled CRONTAB commands';

	if (!cliOptions.url) {
		cliShowUsage(cliUsage, "must provide url for the OO REST API server");
		return false;
	} else {
		options.baseUrl = cliOptions.url + '/oo/rest/v1';
	}

	if (cliOptions.username) {
		options.username = cliOptions.username;
	}

	if (cliOptions.password) {
		options.password = cliOptions.password;
	}

	if (cliOptions.remotehost) {
		options.remoteHost = cliOptions.remotehost;
	} else {
		cliShowUsage(cliUsage, util.format(remoteDetailsErrorMsg, "--remotehost"));
	}

	if (cliOptions.remoteport) {
		options.remotePort = cliOptions.remoteport;
	} else {
		cliShowUsage(cliUsage, util.format(remoteDetailsErrorMsg, "--remoteport"));
	}

	if (cliOptions.remoteuser) {
		options.remoteUser = cliOptions.remoteuser;
	} else {
		cliShowUsage(cliUsage, util.format(remoteDetailsErrorMsg, "--remoteuser"));
	}

	if (cliOptions.remotepass) {
		options.remotePass = cliOptions.remotepass;
	} else {
		cliShowUsage(cliUsage, util.format(remoteDetailsErrorMsg, "--remotepass"));
	}

	if (!cliOptions.crontab) {
		cliShowUsage(cliUsage, "must provide option of --crontab for a crontab file entry to read");
		return false;
	}

	// set OO API settings
	OO.setClient(options);
	return cliOptions;
}

/**
 * parses a crontab file
 * 
 * @method	parseCrontabFile
 * @param 	{String}	the filename to parse
 */
function parseCrontabFile(filename, callback) {

	console.log(chalk.yellow('> Parsing CRONTAB file and importing to OO Scheduled flows:'));

	var crontabStream = fs.createReadStream(filename);

	var rlInstance = rl.createInterface({
		input: crontabStream
	});

	rlInstance.on('line', function(line) {
	  	process.stdout.write(chalk.yellow('-'));

	  	var crontabEntry = line.toString();

	  	// skip bash shell comments, identified by a starting # char or empty lines
	  	if (crontabEntry.length > 0 && crontabEntry[0] !== '#') {

	  		var crontabResource = crontabEntry.split(' ');
			createScheduledFlow(crontabResource);
	  	}
		
	});
}

/**
 * parses a crontab entry
 * 
 * @method	parseCrontabEntry
 * @param 	{object}	the crontab array
 */
function parseCrontabEntry(crontabResource) {

	var crontab, crontabCommand, crontabQurtz;
	var result = [];

	// if we detect a magic char @ then we process just that
	if (crontabResource[0].indexOf('@') === 0) {
		crontab = crontabResource.slice(0, 1);
		crontabCommand = crontabResource.slice(1, 2);
	} else {
		// otherwise we slice the crontab resource array to only 5 elements which is
		// how UNIX crontab entries are formatted
		crontab = crontabResource.slice(0, 5);
		crontabCommand = crontabResource.slice(5, 6);
	}

	crontabQurtz = C2Q.getQuartz(crontab.join(' '));

	// In some cases, a CRON expression might be converted to 2 Quartz-compatible CRON notations because Quartz
	// can't handle the OR behavior in one single notation
	if (crontabQurtz instanceof Array && (crontabQurtz.length >= 1 || crontabQurtz <= 2)) {

		result.push(crontabQurtz);
		result.push(crontabCommand);

		return result;
	} else {
		cliExitError('error converting crontab entry to Quartz syntax');
	}

}

/**
 * creates a scheduled flow in a remote OO install using RESTful API
 * 
 * @method	createScheduledFlow
 * @param 	{object}	the flow object 
 */
function createScheduledFlow(crontabResource) {

	var crontab, flow, cronExecutions;
	var cronExecutionsFailed = [];

	// parseCrontabEntry will parse the crontab resource we get and return an array
	// of 2 elements, first is the crontab schedule, and second is the crontab execution command
	crontab = parseCrontabEntry(crontabResource);	

	if (crontab.length !== 2) {
		cliExitError('error parsing crontab entry');
	}

	cronExecutions = crontab[0];
	cronExecutions.forEach(function(item, index, array) {

		// Due to a bug in OO 10.51 API the 7 chars Quartz Scheduler syntax isn't supported fully
		// and it doesn't reconigze the yearly wildcard so we always take out the last array value
		// which is equivalent to the value of '*'

		item.pop();

		// create flow object
		flow = {
			'flowUuid': '0a8f3175-d71e-4426-b578-1ace1fe1d898',
			'flowScheduleName': 'Scheduled Flow Created By ',
			'triggerExpression': item.join(' '),
			'runLogLevel': 'DEBUG',
			"startDate": Date.now(),
			"username": 'admin',
			"inputPromptUseBlank": true,
			"timeZone": "Asia/Amman",
			'inputs': {
				'host': options.remoteHost,
				'port': options.remotePort,
				'username': options.remoteUser,
				'password': options.remotePass,
				'protocol': 'ssh',
				'command': crontab[1].pop(),
			}
		};
		
		OO.schedules.scheduleFlow(flow, function(err, body) {

			if (err) {
				process.stdout.write(chalk.red('+'));
				cronExecutionsFailed.push(item);
			} else {
				process.stdout.write(chalk.green('+'));
			}
			
		});
		
	});

}


console.log(getPackageInfo());

var cliOptions = cliCheck();
if (!cliOptions) {
	cliExitError();
}

parseCrontabFile(cliOptions.crontab, function() {
	console.log();
	console.log('ended');
});
