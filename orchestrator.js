const startingMilliseconds = Date.now();

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

const NUM_ACTIONS = 10;
const TOTAL_POINTS = 100000;
const POINTS_PER_ACTION = TOTAL_POINTS / NUM_ACTIONS;


// Ignore self signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var piFunctionString = "function main(params) { " +
	"var numPoints = parseInt(params.numPoints); " +
	"var inCircle = 0; " +
	"for(var i=0; i<numPoints; i++){ " +
		"randX = (Math.random() * 2) - 1; " +
		"randY = (Math.random() * 2) - 1; " +
		"distFromCenter = Math.sqrt(randX * randX + randY * randY); " +
		"if (distFromCenter <= 1){ " +
			"inCircle = inCircle + 1; " +
		"} " +
	"} " +
	"return {inCircle: inCircle}; " +
"}";


const request = require('request');
const registerActionPromise = new Promise((resolve, reject) => {
	var headers = {
    	'Content-Type': 'application/json'
	};

	var dataString = JSON.stringify({
		"namespace":"_",
		"name":"testPoints",
		"exec": {
			"kind": "nodejs:6",
			"code": piFunctionString
		}
	});

	var options = {
	    url: 'https://' + AUTH + '@' + APIHOST + '/api/v1/namespaces/_/actions/testPoints?overwrite=true',
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
	    	resolve(false);
	    }
	}

	console.log("Registering action on OpenWhisk");
	request(options, callback);
});

const triggerActionPromise = function(){
	return new Promise((resolve, reject) => {
		var headers = {
	    	'Content-Type': 'application/json'
		};

		var dataString = JSON.stringify({
			"numPoints": POINTS_PER_ACTION
		});

		var options = {
		    url: 'https://' + AUTH + '@' + APIHOST + '/api/v1/namespaces/_/actions/testPoints?blocking=true',
		    method: 'POST',
		    headers: headers,
		    body: dataString
		};

		function callback(error, response, body) {
		    if (!error && response.statusCode == 200) {
		        resolve(JSON.parse(body));
		    } else {
		    	console.log(error);
				console.log(response);
			    resolve(false);
		    }
		}

		request(options, callback);
	});
}

const triggerActionPromises = function(){
	const arr = [];
	for (var i=0; i < NUM_ACTIONS; i++){
		arr.push(triggerActionPromise());
	}
	console.log('Triggering Actions');
	return new Promise((resolve, reject) => {
		Promise.all(arr).then((res) => {
			resolve(res);
		})
	});
}

registerActionPromise.then(triggerActionPromises).then((resp) => {
	if (resp){
		var totalInCircle = 0;
		const totalPoints = NUM_ACTIONS * POINTS_PER_ACTION;
		for (var i = 0; i< resp.length; i++){
			var actionResult = resp[i]["response"]["result"]
			console.log("Action " + (i + 1) + " finished with " + JSON.stringify(actionResult));
			totalInCircle += actionResult['inCircle'];
		}
		console.log(totalInCircle + " out of " + totalPoints + " were in the circle.");
		console.log("Computed Value of Pi: " + 4 * (totalInCircle / totalPoints));
		console.log("Finished in " + ((Date.now() - startingMilliseconds) / 1000) + " seconds");
	} else {
		console.log('it didnt work')
	}
	
});

