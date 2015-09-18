// node modules
var fs = require('fs');
var program = require('commander');

// core parser and interpreter
var parser = require('./src/parser.js');
var interpreter = require('./src/interpreter.js');

// controllers for parsing and interpreting
var controller = require('./src/helpers/interpreterControl.js')();
var textControl = require('./src/helpers/textControl.js')();

program.parse(process.argv);

// get text of jedlang file and place on parsing controller
var body = fs.readFileSync('./'+program.args[0]+'.jhe').toString();
textControl.body = body;

var fileName = program.args[0].split('/');
	fileName = fileName[fileName.length-1];

// parse into ast, mutating interpreting controller custom funcdefs
var stack = parser(textControl, [], controller.defs);

// write to C file and compile
interpreter(stack, fileName, controller);