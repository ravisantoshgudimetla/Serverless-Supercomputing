const NUM_ACTIONS = 100;
const TOTAL_POINTS = 100000;
const POINTS_PER_ACTION = TOTAL_POINTS / NUM_ACTIONS;

var configs = {
	"namespace": "_",
	"actionName": "testPoints",
	"numActions": 100,
	"actionLimits" : {
		"timeout": 60000,
		"memory": 128,
		"logs": 10
	}
}

function main(params) { 
	if (params.shouldFail) { throw 'I am failing'; }
	var inCircle = 0;
	var pointsPerAction = parseInt(params['pointsPerAction'])
	for(var i=0; i<pointsPerAction; i++){
		randX = (Math.random() * 2) - 1;
		randY = (Math.random() * 2) - 1;
		distFromCenter = Math.sqrt(randX * randX + randY * randY);
		if (distFromCenter <= 1){
			inCircle = inCircle + 1;
		}
	}
	return {inCircle: inCircle};
};

function argsForAction(actionNum){
	args = {pointsPerAction: POINTS_PER_ACTION}
	// if (actionNum % 5 == 0 ){
	// 	args['shouldFail'] = true;
	// }
	return args;
}

function computePi(result){
	if (result){
		var totalInCircle = 0;
		for (var i = 0; i< result.length; i++){
			var actionResult = result[i];
			console.log("Action " + (i + 1) + " finished with " + JSON.stringify(actionResult));
			totalInCircle += actionResult['inCircle'];
		}
		console.log(totalInCircle + " out of " + TOTAL_POINTS + " were in the circle.");
		console.log("Computed Value of Pi: " + 4 * (totalInCircle / TOTAL_POINTS));
	} else {
		console.log('it didnt work');
	}
};

exports.configs = configs;
exports.action = main;
exports.argsForAction = argsForAction;
exports.reduce = computePi;
