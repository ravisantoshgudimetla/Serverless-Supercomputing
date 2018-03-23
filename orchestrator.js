const startingMilliseconds = Date.now();

const configFile = process.argv[2];
const custom = require(configFile);
const request = require('request');
const execSync = require('child_process').execSync;

var apiCommandOutput = execSync('wsk property get --apihost').toString();
// Command returns in form 'wsk api host [APIHOST]' so we split string to get host
var APIHOST = apiCommandOutput.split(/\s+/)[3]; 
//console.log(APIHOST);

var authCommandOutput = execSync('wsk property get --auth').toString();
// Command returns in form 'wisk auth [AUTH]' so we split string to get auth
var AUTH = authCommandOutput.split(/\s+/)[2];
var split_auth = AUTH.split(':');
var USER = split_auth[0];
var PWD = split_auth[1];
//console.log(USER, PWD);

const NUM_ACTIONS = custom.configs['numActions']
var responsesReceived = 0;

// Ignore self signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const registerActionPromise = new Promise((resolve, reject) => {
	var headers = {
    	'Content-Type': 'application/json'
	};

	var dataString = JSON.stringify({
		"namespace": custom.configs['namespace'],
		"name": custom.configs['actionName'],
		"exec": {
			"kind": "nodejs:6",
			"code": custom.action.toString()
		},
		"limits": custom.configs['actionLimits']
	});

	var options = {
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
		var headers = {
	    	'Content-Type': 'application/json'
		};

		var actionArgs = custom.argsForAction(actionNum)
		var dataString = JSON.stringify(actionArgs);

		var options = {
		    url: `https://${AUTH}@${APIHOST}/api/v1/namespaces/${custom.configs['namespace']}/actions/${custom.configs['actionName']}`,
		    method: 'POST',
		    headers: headers,
		    body: dataString
		};

		function callback(error, response, body) {
		    if (!error && response.statusCode == 202) {
		    	var body = JSON.parse(body);
		    	var activationId = body.activationId;
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
		    		triggerActionPromise(1).then((r) => {
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


