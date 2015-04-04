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
	// for(var i = 0; i < stack.length; i++){
	// 	console.log('stack: ', stack[i]);
	// 	console.log('children:', stack[i].children);
	// }
	DEFS = funcdefs;
	var command;
	var result = '';
	createFuncDefs(stack);
	while(stack.length){
		command = stack.shift();
		result = buildFunctions(command, result);
		result += ';';
	};
	result = '#include \"jedlang.h\"\n\n'+DECLARATIONS+'\n'+PRE_MAIN+'\nint main(){\n'+IN_SCOPE+'\n'+result + '\n};\n';
	fs.writeFileSync('output.c', result);
	exec('gcc output.c -o '+name+'.out', function(err){
		if(err) console.log(err);
		// exec('rm -rf output.c');
		return;
	});
};

function makeIntObject(num){
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.i = '+num+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'i\',0,'+unionName+'};\n';
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	return structName;
};

function makeStringObject(str){
	var structName = variables.newVariable();
	var unionName = variables.newVariable();
	var charName = variables.newVariable();
	IN_SCOPE += 'char *'+charName+';\n';
	IN_SCOPE += ''+charName+' = (char *) malloc(sizeof(char) * '+(str.length-1)+');\n';
	IN_SCOPE += 'strcpy('+charName+', '+str+');\n';
	IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.s = '+charName+';\n';
	IN_SCOPE += 'struct Object '+structName+' = {\'s\','+(str.length-1)+','+unionName+'};\n';
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	return structName;
};

function makeArrayObject(arr){
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
		if(DEFINED[tree.get('value')].type === 'function' ||
			DEFINED[tree.get('value')].type === 'class'){

			if(DEFINED[tree.get('value')].type === 'class' || tree.get('switch') === 'let'){
				// if the function is a class, we need to save the result in a set object
				var objectName = variables.newVariable();
				result += 'struct Object '+objectName+' = ';
				DEFINED[tree.get('name')] = {name: objectName, type: 'set'};
			}
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
			if(!tree.children.length){
				writeSetObject(tree);
			} else {
				writeClassObject(tree);
			}
		}
		else if(tree.get('action') === 'REDC'){
			writeREDCFunc(tree);
		}
		else if(tree.get('action') === 'ARRY'){
			writeARRYFunc(tree);
		}
		else if(tree.get('action') === 'FLTR'){
			writeFLTRFunc(tree);
		}
		else if(tree.get('action') === 'EACH'){
			writeEACHFunc(tree);
		}
		else if(tree.get('action') === 'CLSS'){
			writeCLASSFunc(tree);
		}
		else {
			var state = stateFactory();
			state.body = tree.data.iterator;
			var result = parser(state, [], DEFS)[0];
			writeCustomFuncs(result, tree);
		}
	}
	return;
};

function writeSetObject(tree){
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
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
	if(members.length !== 1){
		var objectArrName = variables.newVariable();
		var unionName = variables.newVariable();
		IN_SCOPE += 'struct Object *'+objectArrName+';\n';
		IN_SCOPE += ''+objectArrName+' = (struct Object *) malloc(sizeof(struct Object) * '+members.length+');\n';
		for(var i = 0; i < members.length; i++){
			IN_SCOPE += objectArrName+'['+i+'] = '+memberNames[i]+';\n';	
		}

		IN_SCOPE += 'union Data '+unionName+';\n'+unionName+'.oa = '+objectArrName+';\n';
		var objectName = variables.newVariable();
		IN_SCOPE += 'struct Object '+objectName+' = {\'o\','+members.length+','+unionName+'};\n';
		DECLARATIONS += 'struct Object '+objectName+';\n';
	} else {
		console.log('hey')
		var objectName = memberNames[0];
	}
	DEFINED[tree.get('name')] = {name: objectName, type: 'set'};
	IN_SCOPE_LEN.current = IN_SCOPE.length;
	DEFINED[tree.get('name')].definition = IN_SCOPE.substring(IN_SCOPE_LEN.prev, IN_SCOPE.length);
};

function writeClassObject(tree){
	var objectName = variables.newVariable();
	var definition = buildFunctions(tree.children[0],'')+';\n';
	IN_SCOPE += 'struct Object '+objectName + ' = '+definition;
	DEFINED[tree.get('name')] = {name: objectName, type: 'set'};
	IN_SCOPE_LEN.current = IN_SCOPE.length;
}

function writeCLASSFunc(tree){
	var iterator = tree.get('iterator');
	var funcName = variables.newVariable();
	DEFINED[tree.get('name')] = {name: funcName, type: 'class'};
	var arg, funcs = [];
	var funcBody = 'struct Object '+funcName+'(';
	for(var i = 0; i < iterator.length; i++){
		arg = iterator[i];
		if(LETTERS.contains(arg)){
			funcBody += 'struct Object '+arg;
			if(i !== iterator.length-1 && LETTERS.contains(iterator[i+1])){
				funcBody+=', ';
			}
		} else {
			var tree = new Tree();
			tree.set('name', arg);
			tree.set('value', [arg]);
			writeSetObject(tree);
		}
	}
	funcBody += '){\n';
	for(var k = 0; k < iterator.length; k++){
		if(DEFINED[iterator[k]] !== undefined){
			funcBody += DEFINED[iterator[k]].definition;
			iterator[k] = DEFINED[iterator[k]].name;
		}
	}
	funcBody += ';\n';
	funcBody += 'struct Object *obj_arr;\n'
	funcBody += 'obj_arr = (struct Object *) malloc(sizeof(struct Object) * '+iterator.length+');\n';
	for(var i = 0; i < iterator.length; i++){
		funcBody += 'obj_arr['+i+'] = '+iterator[i]+';\n';	
	}
	funcBody += 'union Data arr_union; arr_union.oa = obj_arr;\n';
	funcBody += 'struct Object jed_obj = {\'o\','+iterator.length+',arr_union};\n';
	funcBody += 'return jed_obj;\n}\n';
	PRE_MAIN += funcBody;
}

function writeCustomFuncs(tree, definition){
	IN_SCOPE_LEN.prev = IN_SCOPE_LEN.current;
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
	var result = variables.newVariable();
	funcBody += 'struct Object '+result+' = '+buildFunctions(tree, '', argNames)+';\n';
	funcBody += 'return '+result+';\n};\n';
	var placeholders = ['X','Y','Z'];
	PRE_MAIN += head + IN_SCOPE.substring(IN_SCOPE_LEN.prev, IN_SCOPE_LEN.current) + funcBody;
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev)
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
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
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev);
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
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
	IN_SCOPE = IN_SCOPE.substring(0, IN_SCOPE_LEN.prev);
	IN_SCOPE_LEN.prev = IN_SCOPE.length;
}

function writeFLTRFunc(tree){
	var startingPoint = IN_SCOPE_LEN.current;
	var state = stateFactory();
	state.body = tree.get('iterator');
	var test = parser(state, [], DEFS)[0];
	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object arr){\n';
	funcBody += 'union Data dat; struct Object *ptr; dat.oa = ptr; struct Object obj = {\'o\', 0, dat};\n';
	funcBody += 'int count = 0;\nfor(int i = 0; i < arr.length; i++){\n';
	funcBody += 'struct Object test = '+buildFunctions(test, '',['arr.dat.oa[i]'])+';\n';
	funcBody += 'if(test.dat.i == 1){\nobj = set_append(arr.dat.oa[i],obj);\n}\n}\n';
	funcBody += 'return obj;\n}\n';
	DEFINED[name] = {name: funcName, arguments: argNames, type:'function'};
	PRE_MAIN += head + IN_SCOPE.substring(startingPoint, IN_SCOPE_LEN.current) + funcBody;
	IN_SCOPE_LEN.prev = IN_SCOPE_LEN.current;
	IN_SCOPE_LEN.current = IN_SCOPE.length;
}

function writeEACHFunc(tree){
	var startingPoint = IN_SCOPE.length;
	var state = stateFactory();
	state.body = tree.get('iterator');
	var iterator = parser(state, [], DEFS)[0];
	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object arr){\n';
	funcBody += 'for(int i=0;i<arr.length;i++){\nif(arr.type == \'a\'){\n'
	funcBody += 'union Data dt;\ndt.i = arr.dat.ia[i];\nstruct Object temp = {\'i\', 0, dt};\n'
	funcBody += 'arr.dat.ia[i] = '+buildFunctions(iterator,'',['temp'])+'.dat.i;}\n'
	funcBody += 'else if(arr.type == \'o\'){\n'
	funcBody += 'arr.dat.oa[i] = '+buildFunctions(iterator,'',['arr.dat.oa[i]'])+';\n}\n}\n'
	funcBody += 'return arr; };\n';
	DEFINED[name] = {name: funcName, arguments: argNames, type:'function'};
	PRE_MAIN += head + IN_SCOPE.substring(startingPoint, IN_SCOPE.length) + funcBody;
	IN_SCOPE_LEN.prev = IN_SCOPE_LEN.current;
	IN_SCOPE_LEN.current = IN_SCOPE.length;
}

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
	if(str[0] === ' '){
		str = str.substring(1, str.length);
	}
	if(str[str.length-1] === ' '){
		str = str.substring(0, str.length-1);
	}
	if(str[0] === ' ' || str[str.length-1] === ' '){
		return trim(str);
	}
	return str;
}

function stringToArray(str){
	str = str.replace(/\"/g,'');
	var result = '';
	for(var i = 0; i < str.length; i++){
		result += '\''+str[i]+'\'';
		result += ', ';
	}
	result += '0';
	return result;
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
