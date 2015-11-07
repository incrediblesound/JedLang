var helpers = require('./helpers/helpers.js');
var textControlFactory = require('./helpers/textControl.js');
var findClassName = require('./helpers/findClassName.js');
var parser = require('./parser_module.js');
var chars = require('./helpers/chars.js');
var buildFunctions = require('./buildFunctions.js');
var Set = require('./helpers/set.js').Set;
var basicTypes = require('./basicTypes.js');

var funcs = chars.funcs();
var LETTERS = chars.LETTERS();
var letters = chars.letters();

module.exports = createFuncDefs = function(stack, controller){
	while(stack.length && (stack[0].get('type') === 'funcdef' ||
		  stack[0].get('type') === 'setdef')){
		var tree = stack.shift();
		if(tree.get('type') === 'setdef'){
			if(!tree.children.length){
				writeSetObject(tree, controller);
			} else {
				writeClassObject(tree, controller);
			}
		}
		else if(tree.get('action') === 'REDC'){
			writeREDCFunc(tree, controller);
		}
		else if(tree.get('action') === 'ARRY'){
			writeARRYFunc(tree, controller);
		}
		else if(tree.get('action') === 'FLTR'){
			writeFLTRFunc(tree, controller);
		}
		else if(tree.get('action') === 'EACH'){
			writeEACHFunc(tree, controller);
		}
		else if(tree.get('action') === 'CLSS'){
			writeCLASSFunc(tree, controller);
		}
		else {
			var textControl = textControlFactory();
			textControl.body = tree.data.iterator;
			var result = parser(textControl, [], controller.defs)[0];
			writeCustomFuncs(result, tree, controller);
		}
	}
	return;
};

function writeSetObject(tree, controller){
	controller.setPreviousLength();
	var members = tree.get('value');
	var memberNames = [], name;
	for(var i = 0, l = members.length; i < l; i++){
		var member = members[i];
		if(helpers.getType(member) === 'number'){
			memberNames.push(basicTypes.makeIntObject(member, controller));
		} else {
			member = helpers.trim(member);
			if(controller.defined[member] && controller.defined[member].type === 'set'){
				memberNames.push(controller.defined[member].name);
			} else {
				memberNames.push(basicTypes.makeStringObject(member, controller));
			}
		}
	}
	if(members.length !== 1){
		var objectArrName = controller.variables.newVariable();
		var unionName = controller.variables.newVariable();
		controller.in_scope += 'struct Object *'+objectArrName+';\n';
		controller.in_scope += ''+objectArrName+' = (struct Object *) malloc(sizeof(struct Object) * '+members.length+');\n';
		for(var i = 0; i < members.length; i++){
			controller.in_scope += objectArrName+'['+i+'] = '+memberNames[i]+';\n';	
		}

		controller.in_scope += 'union Data '+unionName+';\n'+unionName+'.oa = '+objectArrName+';\n';
		var objectName = controller.variables.newVariable();
		controller.in_scope += 'struct Object '+objectName+' = {\'o\','+members.length+','+unionName+'};\n';
		controller.declarations += 'struct Object '+objectName+';\n';
	} else {
		var objectName = memberNames[0];
	}
	controller.defined[tree.get('name')] = {name: objectName, type: 'set'};
	controller.setCurrentLength();
	controller.defined[tree.get('name')].definition = controller.getScopeChunk();
};

function writeClassObject(tree, controller){
	var objectName = controller.variables.newVariable();
	var definition = buildFunctions(tree.children[0],'')+';\n';
	controller.in_scope += 'struct Object '+objectName + ' = '+definition;
	controller.defined[tree.get('name')] = {name: objectName, type: 'set'};
	controller.setCurrentLength();
}

function writeCLASSFunc(tree, controller){
	var iterator = tree.get('iterator');
	var funcName = controller.variables.newVariable();
	controller.defined[tree.get('name')] = {name: funcName, type: 'class', label: tree.get('name')};
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
		if(controller.defined[iterator[k]] !== undefined){
			funcBody += controller.defined[iterator[k]].definition;
			iterator[k] = controller.defined[iterator[k]].name;
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
	controller.pre_main += funcBody;
}

function writeCustomFuncs(tree, definition, controller){
	controller.setPreviousLength();
	var args = definition.data.arguments;
	var name = definition.data.name;
	var funcBody = '', argNames = [];
	var funcName = controller.variables.newVariable();
	controller.declarations += helpers.makeDeclaration(funcName, args.length);
	var head = 'struct Object '+funcName+'(';
		
	for(var i = 0; i < args.length; i++){
		argNames.push(controller.variables.newVariable());
		head += 'struct Object '+argNames[i];
		if(i !== args.length-1){
			head += ', ';
		} else { head += '){\n';}
	}

	var classRestriction = findClassName(tree, args, args.length, controller);
	
	controller.defined[name] = {
		name: funcName, 
		arguments: argNames, 
		type:'function', 
		restriction: classRestriction.length ? new Set(classRestriction) : null
	};

	var result = controller.variables.newVariable();
	funcBody += 'struct Object '+result+' = '+buildFunctions(tree, '', argNames, null, controller)+';\n';
	funcBody += 'return '+result+';\n};\n';
	controller.pre_main += head + controller.getScopeChunk() + funcBody;
	controller.removeScopeChunk();
};

function writeREDCFunc(tree, controller){
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
	var funcName = controller.variables.newVariable();
	head += 'struct Object '+funcName+'(struct Object array){\n';
	funcBody += placeholder ? helpers.makeObjectInstance(funcElement) : 'struct Object jed_obj = getInt(array);\n';
	funcBody += 'int i=1;\nfor(i; i<array.length; i++){\n';
	funcBody += 'jed_obj = '+buildFunctions(func, '',['jed_obj','createInt(array.dat.ia[i])'], null, controller)+';';
	funcBody += '}\nreturn jed_obj;\n};\n';
	controller.defined[name] = {name: funcName, arguments: argNames, type:'function'};
	controller.pre_main += head + controller.getScopeChunk() + funcBody;
	controller.removeScopeChunk();
};

function writeARRYFunc(tree, controller){
	var textControl = textControlFactory();
	textControl.body = tree.get('iterator');
	var mutator = parser(textControl, [], controller.defs)[0];

	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = controller.variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object num, struct Object el){\n';
	funcBody += 'int arr[1] = { el.dat.i };\n';
	funcBody += 'union Data dat; dat.ia = arr;\n'
	funcBody += 'struct Object result = {\'a\',1,dat};\n';
	funcBody += 'int i=1;\nfor(i; i<num.dat.i; i++){\n';
	funcBody += 'el = '+buildFunctions(mutator, '',['el'], null, controller)+';\n';
	funcBody += 'result = append(el, result);\n';
	funcBody += '}\nreturn result;\n};\n';
	controller.defined[name] = {name: funcName, arguments: argNames, type:'function'};
	controller.pre_main += head + controller.getScopeChunk() + funcBody;
	controller.removeScopeChunk();
}

function writeFLTRFunc(tree, controller){
	var textControl = textControlFactory();
	textControl.body = tree.get('iterator');
	var test = parser(textControl, [], controller.defs)[0];
	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = controller.variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object arr){\n';
	funcBody += 'union Data dat; struct Object *ptr; dat.oa = ptr; struct Object obj = {\'o\', 0, dat};\n';
	funcBody += 'int count = 0;\nint i = 0;\nfor(i; i < arr.length; i++){\n';
	funcBody += 'struct Object test = '+buildFunctions(test, '',['arr.dat.oa[i]'], null, controller)+';\n';
	funcBody += 'if(test.dat.i == 1){\nobj = set_append(arr.dat.oa[i],obj);\n}\n}\n';
	funcBody += 'return obj;\n}\n';
	controller.defined[name] = {name: funcName, arguments: argNames, type:'function'};
	controller.pre_main += head + controller.getScopeChunk() + funcBody;
	controller.removeScopeChunk();
}

function writeEACHFunc(tree, controller){
	var textControl = textControlFactory();
	textControl.body = tree.get('iterator');
	var iterator = parser(textControl, [], controller.defs)[0];
	var name = tree.get('name');
	var funcBody = '', argNames = [];
	var funcName = controller.variables.newVariable();
	var head = 'struct Object '+funcName+'(struct Object arr){\n';
	funcBody += 'int i = 0;\nfor(i;i<arr.length;i++){\nif(arr.type == \'a\'){\n'
	funcBody += 'union Data dt;\ndt.i = arr.dat.ia[i];\nstruct Object temp = {\'i\', 0, dt};\n'
	funcBody += 'arr.dat.ia[i] = '+buildFunctions(iterator,'',['temp'], null, controller)+'.dat.i;}\n'
	funcBody += 'else if(arr.type == \'o\'){\n'
	funcBody += 'arr.dat.oa[i] = '+buildFunctions(iterator,'',['arr.dat.oa[i]'], null, controller)+';\n}\n}\n'
	funcBody += 'return arr; };\n';
	controller.defined[name] = {name: funcName, arguments: argNames, type:'function'};
	controller.pre_main += head + controller.getScopeChunk() + funcBody;
	controller.removeScopeChunk();
}