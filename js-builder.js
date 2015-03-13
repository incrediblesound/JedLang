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
DEFINED = {};

ARG_MAP = {
	'X': 0,
	'Y': 1,
	'Z': 2
};

var variables = {
	vars: {},
	newVariable: function(){
		var result = '';
		for(var i = 0; i < 8; i++){
			result += letters.rnd();
		}
		if(this.vars[result] !== undefined){
			return this.newVariable();
		} else {
			return result;
		}
	}
};

function makeIntObject(num){
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.i = '+num+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'i\',0,'+unionName+'};\n';
	return structName;
};

function makeStringObject(str){
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	var charName = variables.newVariable();
	IN_SCOPE += 'char '+charName+'['+(str.length+1)+'];\n';
	IN_SCOPE += 'strcpy('+charName+','+str+');\n';
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.s = '+charName+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'s\','+(str.length+1)+','+unionName+'};\n';
	return structName;
};

////// make array object

DECLARATIONS = '';
PRE_MAIN = '';
PRE_BODY = '';
IN_SCOPE = '';
DEFS = null;
module.exports = function(stack, name, funcdefs){
	DEFS = funcdefs;
	var command;
	var result = '';
	createFuncDefs(stack);
	while(stack.length){
		command = stack.shift();
		result = buildFunctions(command, result);
		result += ';';
	};
	result = '#include \"jedlang.h\"\n\n'+DECLARATIONS+'\n'+PRE_MAIN+'\nint main(){\n'+IN_SCOPE+'\n'+result + '\n};';
	fs.writeFileSync('output.c', result);
	exec('gcc output.c -o '+name+'.out', function(err){
		if(err) console.log(err);
		// exec('rm -rf output.c');
		return;
	});
};


function buildFunctions(tree, result, argNames){
	if(tree.data.type === 'value' && LETTERS.contains(tree.data.value)){
		result += ''+argNames[ARG_MAP[tree.data.value]];
	}
	else if(tree.data.type === 'value'){
		result += makeIntObject(tree.data.value);
	}
	else if(tree.data.type === 'string'){
		result += makeStringObject(tree.data.value);
	}
	else if(tree.data.type === 'array'){
		result += '['+tree.data.value+']';
	}
	else if(tree.data.type === 'custom' && DEFINED[tree.data.value] !== undefined){
		result += DEFINED[tree.data.value].name + '(';
		for(var i = 0; i < tree.children.length; i++){
			result = buildFunctions(tree.children[i], result, argNames);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.data.type === 'function' && tree.data.value !== '?'){
		result += sys.map[tree.data.value];
		for(var i = 0; i < tree.children.length; i++){
			result = buildFunctions(tree.children[i], result, argNames);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.data.value === '?'){
		var argsText = (argNames !== undefined) ? argNameText(argNames, false) : '';
		var argsTextInner = (argNames !== undefined) ? argNameText(argNames, true) : '';
		var arg_one = tree.children[1], arg_two = tree.children[2];
		var condition = tree.children[0];
		var arg_one_name = variables.newVariable(), arg_two_name = variables.newVariable();
		var wrapper_name = variables.newVariable();
		var isShow;
		var head = '';

		var arg_one_func_body = buildFunctions(arg_one,'',argNames);

		var arg_two_func_body = buildFunctions(arg_two,'',argNames);
		
		DECLARATIONS += makeDeclaration(wrapper_name, argNames.length);
		var func_body = buildFunctions(condition,'',argNames);
		head += 'struct Object '+wrapper_name+'('+argsText+'){\n'+IN_SCOPE+
			'struct Object truthval = '+func_body+';\nstruct Object result;\n'+
			'if(truthval.dat.i == 1){\nresult = '+arg_one_func_body+';\n'+
			'} else {\nresult='+arg_two_func_body+';\n} return result;\n};\n';
		
		IN_SCOPE = '';
		tail = ''+wrapper_name+'('+argsTextInner+')';
		PRE_MAIN += head;
		result += tail;
	}
	return result;
};

function createFuncDefs(stack){
	while(stack.length && stack[0].data.type === 'funcdef'){
		var tree = stack.shift();
		if(tree.data.action === 'REDC'){
			writeREDCFunc(tree);
		}
		else if(tree.data.action === 'ARRY'){
			writeARRYFunc(tree);
		}
		else {
			var state = stateFactory();
			state.body = tree.data.iterator;
			var result = parser(state, [], DEFS)[0];
			// functions[tree.data.name] = fillVariables(result);
			writeCustomFuncs(result, tree);
		}
	}
	return;
};

function writeCustomFuncs(tree, definition){
	var args = definition.data.arguments;
	var name = definition.data.name;
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	DECLARATIONS += makeDeclaration(funcName, args.length);
	funcBody += 'struct Object '+funcName+'(';
	for(var i = 0; i < args.length; i++){
		argNames.push(variables.newVariable());
		funcBody += 'struct Object '+argNames[i];
		if(i !== args.length-1){
			funcBody += ', ';
		} else { funcBody += '){\n';}
	}
	DEFINED[name] = {name: funcName, arguments: argNames};
	// tree = insertVariableNames(tree, argNames);
	var result = variables.newVariable();
	funcBody += 'struct Object '+result+' = '+buildFunctions(tree, '', argNames)+';\n';
	funcBody += 'return '+result+';\n};\n';
	var placeholders = ['X','Y','Z'];
	PRE_MAIN += funcBody;
	return;
};

function writeREDCFunc(tree){
	// make iterator function
	var funcData = tree.data.iterator.replace(/\(|\)/g,'').split(' ');
	var funcName = funcData[0], funcElement = funcData[1];
	var func = new Tree();
	func.set('type','function'); func.set('value',funcName);
	var child = func.insert(); child.set('type','value'); child.set('value','X');
	var placeholder = false;
		if(letters.contains(funcElement)){
	    	child = func.insert(); child.set('type','value'); child.set('value','Y');
		} else {
			placeholder = true;
			child = func.insert(); child.set('type','value'); child.set('value',funcElement);
		}

	var name = tree.data.name;
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	funcBody += 'var '+funcName+'= function(array){\n';
	funcBody += 'var result;\nfor(var i=1, l=array.length; i<l; i++){\n';
	funcBody += 'if(i===1){ result = '+(placeholder ? funcElement : 'array[0]')+' };\n'
	funcBody += 'result = '+buildFunctions(func, '',['result','array[i]']);
	funcBody += '}\nreturn result;\n};\n';
	DEFINED[name] = {name: funcName, arguments: argNames};
	PRE_MAIN += funcBody;
};

function writeARRYFunc(tree){
	var state = stateFactory();
	state.body = tree.data.iterator;
	var mutator = parser(state, [], DEFS)[0];

	var name = tree.data.name;
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	funcBody += 'var '+funcName+'= function(num, el){\n';
	funcBody += 'var result = [], current = el;\n';
	funcBody += 'for(var i=0; i<num; i++){\n';
	funcBody += 'current = '+buildFunctions(mutator, '',['current'])+'\n';
	funcBody += 'result.push(current);\n';
	funcBody += '}\nreturn result;\n};\n';
	DEFINED[name] = {name: funcName, arguments: argNames};
	PRE_MAIN += funcBody;
	
}

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

function argNameText(array, inner){
	var result = '';
	for(var i =0; i < array.length; i++){
		result += (!inner ? 'struct Object ': '')+array[i];
		if(i !== array.length-1){
			result += ',';
		}
	}
	return result;
};

function makeDeclaration(name, num){
	var result = 'struct Object ';
	result += name+'(';
	while(num > 0){
		num--;
		result += 'struct Object';
		if(num > 0){
			result += ', ';
		}
	}
	result += ');\n';
	return result;
};

var replaceCustomFuncs = function replaceCustomFuncs(stack){
	var temp;
	for(var i = 0; i < stack.length; i++){
		console.log(DEFINED)
		if(stack[i].data.type === 'custom' && 
			DEFINED[stack[i].data.value] === undefined){
			stack[i] = functions[stack[i].data.value](stack[i]);
		} 
		if(stack[i].children.length){
			for(var k = 0, l = stack[i].children.length; k < l; k++){
				stack[i].children[k] = recurse(stack[i].children[k]);
			}
		}
	}
	return stack;

	function recurse(tree){
		if(tree.data.type === 'custom'){
			tree = functions[tree.data.value](tree);
		}
		if(tree.children.length){
			for(var i = 0, l = tree.children.length; i < l; i++){
				tree.children[i] = recurse(tree.children[i], root);
			}
		}
		return tree;
	};
};