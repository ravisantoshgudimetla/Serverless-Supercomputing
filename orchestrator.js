const startingMilliseconds = Date.now();

const checkConfigFile = function (resource, errMsg){
	if (!resource){
		console.log("Error with config file: " + errMsg);
		process.exit(1);
	}
}

checkConfigFile(process.argv[2], "No file passed as argument");
const configFile = process.argv[2];
const custom = require(configFile);
checkConfigFile(custom.action, "Need to export a function named 'action' to be run on OpenWhisk.");
checkConfigFile(custom.reduce, "Need to export a function named 'reduce' to combine results.");
checkConfigFile(custom.configs, "Need to export a dictionary named 'configs' with requred configurations.");
checkConfigFile(custom.configs['numActions'], "Configs dictionary must contain 'numActions' parameter.");
checkConfigFile(custom.configs['actionName'], "Configs dictionary must contain 'actionName' parameter.");
checkConfigFile(custom.configs['namespace'], "Configs dictionary must contain 'namespace' parameter.");

const request = require('request');
const execSync = require('child_process').execSync;

const apiCommandOutput = execSync('wsk property get --apihost').toString();
// Command returns in form 'wsk api host [APIHOST]' so we split string to get host
const APIHOST = apiCommandOutput.split(/\s+/)[3]; 
//console.log(APIHOST);

const authCommandOutput = execSync('wsk property get --auth').toString();
// Command returns in form 'wisk auth [AUTH]' so we split string to get auth
const AUTH = authCommandOutput.split(/\s+/)[2];
const split_auth = AUTH.split(':');
const USER = split_auth[0];
const PWD = split_auth[1];
//console.log(USER, PWD);

const NUM_ACTIONS = custom.configs['numActions']
var responsesReceived = 0;

var activationIdToActionNumMap = {};

// Ignore self signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const registerActionPromise = new Promise((resolve, reject) => {
	const headers = {
    	'Content-Type': 'application/json'
	};

	const dataString = JSON.stringify({
		"namespace": custom.configs['namespace'],
		"name": custom.configs['actionName'],
		"exec": {
			"kind": "nodejs:6",
			"code": custom.action.toString()
		},
		"limits": custom.configs['actionLimits']
	});

	const options = {
	    url: `https://${AUTH}@${APIHOST}/api/v1/namespaces/${custom.configs['namespace']}/actions/${custom.configs['actionName']}?overwrite=true`,
	    method: 'PUT',
	    headers: headers,
	    body: dataString
	};

	function callback(error, response, body) {
	    if (!error && response.statusCode == 200) {
	        console.log(body);
	        console.log("Action Registered");
	        resolve(body);
	    } else {
	    	console.log(error);
			console.log(response);
	    	reject(response);
	    }
	}

	console.log("Registering action on OpenWhisk");
	request(options, callback);
});

const triggerActionPromise = function(actionNum){
	return new Promise((resolve, reject) => {
		const headers = {
	    	'Content-Type': 'application/json'
		};

		const actionArgs = custom.argsForAction ? custom.argsForAction(actionNum) : {};
		const dataString = JSON.stringify(actionArgs);

		const options = {
		    url: `https://${AUTH}@${APIHOST}/api/v1/namespaces/${custom.configs['namespace']}/actions/${custom.configs['actionName']}`,
		    method: 'POST',
		    headers: headers,
		    body: dataString
		};

		function callback(error, response, body) {
		    if (!error && response.statusCode == 202) {
		    	body = JSON.parse(body);
		    	const activationId = body.activationId;
		    	activationIdToActionNumMap[activationId] = actionNum;
		    	console.log("Action started with id: " + activationId);
		    	getResultPromise(activationId).then((res) => {
		    		resolve(res);
		    	}).catch((err) => {
		    		reject(err);
		    	})
		    } else {
				reject(response);
		    }
		}

		request(options, callback);
	});
}

const getResultPromise = function(activationId){
	return new Promise((resolve, reject) => {
		console.log('Getting result of action: ' + activationId);
		var headers = {
	    	'Content-Type': 'application/json'
		};

		var options = {
		    url: 'https://' + AUTH + '@' + APIHOST + '/api/v1/namespaces/_/activations/' + activationId,
		    method: 'GET',
		    headers: headers
		};

		function callback(error, response, body) {
		    var body = JSON.parse(body);
		    if (!error && response.statusCode == 200) {
		    	var resp = body.response;
		    	if (resp.status == 'success'){
		    		responsesReceived++;
		    		resolve(resp.result);
		    	} else if (resp.status == 'action developer error') {
		    		console.log('Action ' + activationId + ' failed, trying again');
		    		console.log(body);
		    		triggerActionPromise(activationIdToActionNumMap[activationId]).then((r) => {
		    			resolve(r);
		    		}).catch((err) => {
		    			reject(err);
		    		});
		    	} else {
		    		reject(response);
		    	}
		    //} else if (body.error && body.error == "The requested resource does not exist."){
		    } else if (!body.success){
		    	setTimeout(() => {
		    		console.log("Action " + activationId + " hasn't finished yet... checking again.");
		    		console.log(responsesReceived + " out of " + NUM_ACTIONS + " actions have finished");
			    	getResultPromise(activationId).then((r) => {
			    		resolve(r);
			    	}).catch((err) => {
			    		reject(err);
			    	});
		    	}, 5000);
		    }
		}

		request(options, callback);

	});
}

const triggerActionPromises = function(){
	const arr = [];
	for (var i=0; i < NUM_ACTIONS; i++){
		arr.push(triggerActionPromise(i));
	}
	console.log('Triggering Actions');
	return new Promise((resolve, reject) => {
		Promise.all(arr).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		})
	});
}

registerActionPromise.then(triggerActionPromises).then((response) => {
	custom.reduce(response);
	console.log("Finished in " + ((Date.now() - startingMilliseconds) / 1000) + " seconds");
}).catch((err) => {
	console.log('Operation failed');
	console.log(err);
});


