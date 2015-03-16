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

DECLARATIONS = '';
PRE_MAIN = '';
PRE_BODY = '';
IN_SCOPE = '';
IN_SCOPE_LEN = {prev: 0, current: 0};
DEFS = null;

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

function makeIntObject(num){
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.i = '+num+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'i\',0,'+unionName+'};\n';
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	return structName;
};

function makeStringObject(str){
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	var charName = variables.newVariable();
	IN_SCOPE += 'char '+charName+'['+(str.length+1)+'];\n';
	IN_SCOPE += 'strcpy('+charName+','+str+');\n';
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.s = '+charName+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'s\','+(str.length+1)+','+unionName+'};\n';
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	return structName;
};

function makeArrayObject(arr){
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	var arrName = variables.newVariable();
	IN_SCOPE += 'int '+arrName+'['+arr.length+'] = {'+arr.toString()+'};\n';
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.ia = '+arrName+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'a\','+arr.length+','+unionName+'};\n';
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	return structName;
}

function buildFunctions(tree, result, argNames){
	if(tree.get('type') === 'value' && LETTERS.contains(tree.get('value'))){
		result += ''+argNames[ARG_MAP[tree.get('value')]];
	}
	else if(tree.get('type') === 'value'){
		result += makeIntObject(tree.get('value'));
	}
	else if(tree.get('type') === 'string'){
		result += makeStringObject(tree.get('value'));
	}
	else if(tree.get('type') === 'array'){
		result += makeArrayObject(tree.get('value'));
	}
	else if(tree.get('type') === 'custom' && DEFINED[tree.get('value')] !== undefined){
		if(DEFINED[tree.get('value')].type === 'function'){
			result += DEFINED[tree.get('value')].name + '(';
			for(var i = 0; i < tree.size(); i++){
				result = buildFunctions(tree.children[i], result, argNames);
				if(i !== tree.children.length-1){
					result += ',';
				}
			}
			result += ')';	
		} else {
			result += DEFINED[tree.get('value')].name;
		}
	}
	else if(tree.get('type') === 'function' && tree.data.value !== '?'){
		result += sys.map[tree.get('value')];
		for(var i = 0; i < tree.size(); i++){
			result = buildFunctions(tree.children[i], result, argNames);
			if(i !== tree.size()-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.get('value') === '?'){
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
	while(stack.length && (stack[0].get('type') === 'funcdef' ||
		  stack[0].get('type') === 'setdef')){
		var tree = stack.shift();
		if(tree.get('type') === 'setdef'){
			writeSetObject(tree);
		}
		else if(tree.data.action === 'REDC'){
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

function writeSetObject(tree){
	var members = tree.get('value');
	var memberNames = [], name;
	for(var i = 0, l = members.length; i < l; i++){
		var member = members[i];
		if(getType(member) === 'number'){
			memberNames.push(makeIntObject(member));
		} else {
			member = trim(member);
			if(DEFINED[member] && DEFINED[member].type === 'set'){
				memberNames.push(DEFINED[member].name);
			} else {
				memberNames.push(makeStringObject(member));
			}
		}
	}
	var objectArrName = variables.newVariable();
	var unionName = variables.newVariable();
	IN_SCOPE += 'struct Object '+objectArrName+'['+members.length+
		'] = {'+printList(memberNames)+'};\n';
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.oa = '+objectArrName+';\n';
	var objectName = variables.newVariable();
	IN_SCOPE += 'struct Object '+objectName+' = {\'u\','+members.length+','+unionName+'};\n';
	DEFINED[tree.get('name')] = {name: objectName, type: 'set'};
	IN_SCOPE_LEN.current = IN_SCOPE.length;
}

function writeCustomFuncs(tree, definition){
	var args = definition.data.arguments;
	var name = definition.data.name;
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	DECLARATIONS += makeDeclaration(funcName, args.length);
	var head = 'struct Object '+funcName+'(';
	for(var i = 0; i < args.length; i++){
		argNames.push(variables.newVariable());
		head += 'struct Object '+argNames[i];
		if(i !== args.length-1){
			head += ', ';
		} else { head += '){\n';}
	}
	DEFINED[name] = {name: funcName, arguments: argNames, type:'function'};
	// tree = insertVariableNames(tree, argNames);
	var result = variables.newVariable();
	funcBody += 'struct Object '+result+' = '+buildFunctions(tree, '', argNames)+';\n';
	funcBody += 'return '+result+';\n};\n';
	var placeholders = ['X','Y','Z'];
	PRE_MAIN += head + IN_SCOPE.substring(IN_SCOPE_LEN.prev, IN_SCOPE_LEN.current) + funcBody;
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev)
	return;
};

function writeREDCFunc(tree){
	// make iterator function
	var funcData = tree.get('iterator').replace(/\(|\)/g,'').split(' ');
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
	var name = tree.get('name');
	var funcBody = '', head = '', argNames = [];
	var funcName = variables.newVariable();
	head += 'struct Object '+funcName+'(struct Object array){\n';
	funcBody += placeholder ? makeObjectInstance(funcElement) : 'struct Object jed_obj = getInt(array);\n';
	funcBody += 'for(int i=1; i<array.length; i++){\n';
	funcBody += 'jed_obj = '+buildFunctions(func, '',['jed_obj','createInt(array.dat.ia[i])'])+';';
	funcBody += '}\nreturn jed_obj;\n};\n';
	DEFINED[name] = {name: funcName, arguments: argNames, type:'function'};
	PRE_MAIN += head + IN_SCOPE.substring(IN_SCOPE_LEN.prev, IN_SCOPE_LEN.current) + funcBody;
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev)
};

function writeARRYFunc(tree){
	var state = stateFactory();
	state.body = tree.get('iterator');
	var mutator = parser(state, [], DEFS)[0];

	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object num, struct Object el){\n';
	funcBody += 'int arr[1] = { el.dat.i };\n';
	funcBody += 'union Data dat; dat.ia = arr;\n'
	funcBody += 'struct Object result = {\'a\',1,dat};\n';
	funcBody += 'for(int i=1; i<num.dat.i; i++){\n';
	funcBody += 'el = '+buildFunctions(mutator, '',['el'])+';\n';
	funcBody += 'result = append(el, result);\n';
	funcBody += '}\nreturn result;\n};\n';
	DEFINED[name] = {name: funcName, arguments: argNames, type:'function'};
	PRE_MAIN += head + IN_SCOPE.substring(IN_SCOPE_LEN.prev, IN_SCOPE_LEN.current) + funcBody;
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev)
}

function insertVariableNames(tree, argNames){
	tree = changeVar(tree);
	return tree;

	function changeVar(tree){
		var placeholders = ['X','Y','Z'];
		if(tree.get('type') === 'value'){
			for(var i = 0; i < placeholders.length; i++){
				if(tree.get('value') === placeholders[i]){
					tree.get('value') = argNames[i];
				}
			}
		}
		if(tree.size()){
			for(var k = 0; k < tree.size(); k++){
				changeVar(tree.children[k]);
			}
		}
		return tree;
	}
};

function argNameText(array, inner){
	var result = '';
	for(var i =0; i < array.length; i++){
		result += (!inner ? 'struct Object ': '')+array[i];
		if(i < array.length-1){
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

function makeObjectInstance(value){
	if(parseInt(value) === parseInt(value)){
		return 'struct Object jed_obj = createInt('+value+');\n';
	}
	else if(typeof value === 'string'){
		var result = 'char str['+(value.length+1)+'];\n'+
		'strcpy(str, '+value+');\nstruct Object jed_obj = createString('+value+');\n';
		return result;
	}
};

function getType(val){
	if(parseInt(val) === parseInt(val)){
		return 'number';
	}
	else {
		return typeof val;
	}
}

function trim(str){
	return str.replace(' ', '', 'g');
}

function printList(arr){
	var result = '';
	for(var i = 0; i < arr.length; i++){
		result += arr[i];
		if(i < arr.length-1){
			result += ', ';
		}
	}
	return result;
}