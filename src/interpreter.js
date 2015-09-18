var fs = require('fs');
var exec = require('child_process').exec;
var _ = require('lodash');
var sys = require('./helpers/func.js');
var Set = require('./helpers/set.js').Set;
var Tree = require('./helpers/tree.js').Tree;
var createFuncDefs = require('./functionDefinitions.js');
var helpers = require('./helpers/helpers.js');
var chars = require('./helpers/chars');
var buildFunctions = require('./buildFunctions.js');

var funcs = chars.funcs();
var letters = chars.letters();
var LETTERS = chars.LETTERS();
var VARIABLES = chars.VARIABLES();
var ERRORS = chars.ERRORS();


module.exports = function(stack, name, controller){
	var command;
	var result = '';
	createFuncDefs(stack, controller);
	while(stack.length){
		command = stack.shift();
		result = buildFunctions(command, result, null, null, controller);
		result += ';\n';
	};
	if(ERRORS.isEmpty()){
		result = '#include \"jedlang.h\"\n\n'+controller.declarations+'\n'+controller.pre_main+'\nint main(){\n'+controller.in_scope+'\n'+result + '\n};\n';
		fs.writeFileSync('./src/output.c', result);
		exec('gcc ./src/output.c -o '+name+'.out', function(err){
			if(err) console.log(err);
			// exec('rm -rf output.c');
			return;
		});
	} else {
		ERRORS.print();
	}
};


