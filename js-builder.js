var fs = require('fs');
var sys = require('./func.js');
var Set = require('./set.js').Set;
var Tree = require('./tree.js').Tree;
var exec = require('child_process').exec;
var stateFactory = require('./state.js');
var parser = require('./parser_module.js');

var functions = {};
functions.Tree = Tree;
funcs = new Set(['+','-','*','/','>']);
letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);

CURRENT_TYPE = null;

var variables = {
	vars: {},
	newVariable: function(){
		var result = '';
		for(var i = 0; i < 16; i++){
			result += letters.rnd();
		}
		if(this.vars[result] !== undefined){
			return this.newVariable();
		} else {
			return result;
		}
	}
};

PRE_MAIN = '';
DEFS = null;
module.exports = function(stack, name, funcdefs){
	DEFS = funcdefs;
	var command;
	var result = '';
	createFuncDefs(stack);
	stack = replaceCustomFuncs(stack);
	identifyPrintFuncs(stack);
	while(stack.length){
		command = stack.shift();
		result = buildFunctions(command, result);
		result += ';';
	};
	fs.readFile('./sys.js', function(buffer){
		var sys = buffer.toString();
		fs.writeFileSync(name+'.js', result+buffer);
	})
};


function buildFunctions(tree, result){
	if(tree.data.type === 'value' || tree.data.type === 'string'){
		result += tree.data.value;
	}
	else if(tree.data.type === 'array'){
		result += tree.data.value;
	}
	else if(tree.data.type === 'function' && tree.data.value !== '?'){
		result += sys.map[tree.data.value][0];
		for(var i = 0; i < tree.children.length; i++){
			result = buildFunctions(tree.children[i], result);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.data.value === '?'){
		var arg_one = tree.children[1], arg_two = tree.children[2];
		var condition = tree.children[0];
		var arg_one_name = variables.newVariable(), arg_two_name = variables.newVariable();
		var wrapper_name = variables.newVariable();
		var head = 'var '+arg_one_name+'=(){'+arg_one_name+' = '+buildFunctions(arg_one,'')+'; return '+arg_one_name+';};';
		head += 'var '+arg_two_name+'=(){'+arg_two_name+' = '+buildFunctions(arg_two,'')+'; return '+arg_two_name+';};';
		head += wrapper_name+'(){ var truthval = istrue('+buildFunctions(condition,'')+');'+
		'var result;'+'if(truthval){ result = '+arg_one_name+'();}else{ result='+arg_two_name+'();} return result;};';
		tail = ''+wrapper_name+'()';
		PRE_MAIN = PRE_MAIN + head;
		result = result+tail;
	}
	return result;
};

function createFuncDefs(stack){
	while(stack.length && stack[0].data.type === 'funcdef'){
		var tree = stack.shift();
		if(tree.data.action === 'EACH'){
			var funcData = tree.data.iterator.replace(/\(|\)/g,'').split(' ');
			var funcName = funcData[0];
			var funcElement = funcData[1];
			body  = 'root = root.children[0];var mainTree = new this.Tree();';
			body += 'var tree = mainTree;';
			body += 'tree.set("type", "function"); tree.set("value","'+funcName+'");';
			body += 'for(var i = 0; i < root.data.value.length; i++){';
			if(letters.contains(funcElement)){
				body += 'var child = tree.insert(); child.set("type","value"); child.set("value",root.data.value[i]);';
			} else {
				body += 'var child = tree.insert(); child.set("type","value"); child.set("value",'+funcElement+');';
			}
			body += 'if(i === root.data.value.length-1){';
			body += 'var child = tree.insert(); child.set("type","value"); child.set("value",'+tree.data["null"]+');}';
			body += 'else{tree = tree.insert(); tree.set("type", "function"); tree.set("value","'+funcName+'");}}';
			body += 'return mainTree;';
			var func = new Function('root',body);
			functions[tree.data.name] = func;
		}
		else {
			var state = stateFactory();
			state.body = tree.data.iterator;
			var result = parser(state, [], DEFS);
			functions[tree.data.name] = fillVariables(result[0]);
		}
	}
	return;
};

function writeCustomFuncs(tree, definition){
	var args = definition.data.arguments;
	var name = definition.data.name;
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	funcBody += 'var '+funcName+'= function(';
	for(var i = 0; i < args.length; i++){
		argNames.push(variables.newVariable());
		funcBody += argNames[i];
		if(i !== args.length-1){
			funcBody += ', ';
		} else { funcBody += '){';}
	}
	DEFINED[name] = {name: funcName, arguments: argNames};
	tree = insertVariableNames(tree, argNames);
	var result = variables.newVariable();
	funcBody += 'var '+result+' = '+buildFunctions(tree, '', argNames)+';';
	funcBody += 'return '+result+';};';
	var placeholders = ['X','Y','Z'];
	PRE_MAIN += funcBody;
	return;
};

function insertVariableNames(tree, argNames){
	tree = changeVar(tree);
	return tree;

	function changeVar(tree){
		var placeholders = ['X','Y','Z'];
		if(tree.data.type === 'value'){
			for(var i = 0; i < placeholders.length; i++){
				if(tree.data.value === placeholders[i]){
					tree.data.value = argNames[i];
				}
			}
		}
		if(tree.children.length){
			for(var k = 0; k < tree.children.length; k++){
				changeVar(tree.children[k]);
			}
		}
		return tree;
	}
};

var fillVariables = function(tree){
	return function(root){
		var args = root.children;
		recurse(tree);
		return tree;
		function recurse(tree){
			if(tree.data.type === 'value' && LETTERS.contains(tree.data.value)){
				if(tree.data.value === 'X'){
					tree.data.value = root.children[0].data.value;
					tree.data.type = root.children[0].data.type;
					tree.children = root.children[0].children;
				}
				if(tree.data.value === 'Y'){
					tree.data.value = root.children[1].data.value;
					tree.data.type = root.children[1].data.type;
					tree.children = root.children[1].children;
				}
				if(tree.data.value === 'Z'){
					tree.data.value = root.children[2].data.value;
					tree.data.type = root.children[2].data.type;
					tree.children = root.children[2].children;
				}
			}
			if(tree.children.length){
				for(var i = 0, l = tree.children.length; i < l; i++){
					recurse(tree.children[i]);
				}
			}
		};
	}
};

// var replaceCustomFuncs = function replaceCustomFuncs(stack){
// 	var temp;
// 	for(var i = 0; i < stack.length; i++){
// 		if(stack[i].data.type === 'custom'){
// 			stack[i] = functions[stack[i].data.value](stack[i]);
// 		} 
// 		if(stack[i].children.length){
// 			for(var k = 0, l = stack[i].children.length; k < l; k++){
// 				stack[i].children[k] = recurse(stack[i].children[k]);
// 			}
// 		}
// 	}
// 	return stack;

// 	function recurse(tree){
// 		if(tree.data.type === 'custom'){
// 			tree = functions[tree.data.value](tree);
// 		}
// 		if(tree.children.length){
// 			for(var i = 0, l = tree.children.length; i < l; i++){
// 				tree.children[i] = recurse(tree.children[i], root);
// 			}
// 		}
// 		return tree;
// 	};
// };