var _ = require('lodash');
var sys = require('./helpers/func.js');
var chars = require('./helpers/chars.js');
var funcs = chars.funcs();
var letters = chars.letters();
var LETTERS = chars.LETTERS();
var VARIABLES = chars.VARIABLES();
var ERRORS = chars.ERRORS();

function makeIntObject(num, controller){
	var structName = controller.variables.newVariable();
	var unionName = controller.variables.newVariable();
	controller.in_scope += 'union Data '+unionName+';\n'+unionName+'.i = '+num+';\n';
	controller.in_scope += 'struct Object '+structName+' = {\'i\',0,'+unionName+'};\n';
	controller.in_scope_len.current = controller.in_scope.length;
	return structName;
};

function makeStringObject(str, controller){
	var structName = controller.variables.newVariable();
	var unionName = controller.variables.newVariable();
	var charName = controller.variables.newVariable();
	controller.in_scope += 'char *'+charName+';\n';
	controller.in_scope += ''+charName+' = (char *) malloc(sizeof(char) * '+(str.length-1)+');\n';
	controller.in_scope += 'strcpy('+charName+', '+str+');\n';
	controller.in_scope += 'union Data '+unionName+';\n'+unionName+'.s = '+charName+';\n';
	controller.in_scope += 'struct Object '+structName+' = {\'s\','+(str.length-1)+','+unionName+'};\n';
	controller.in_scope_len.current = controller.in_scope.length;
	return structName;
};

function makeArrayObject(arr, controller){
	var structName = controller.variables.newVariable();
	var unionName = controller.variables.newVariable();
	var arrName = controller.variables.newVariable();
	controller.in_scope += 'int '+arrName+'['+arr.length+'] = {'+arr.toString()+'};\n';
	controller.in_scope += 'union Data '+unionName+';\n'+unionName+'.ia = '+arrName+';\n';
	controller.in_scope += 'struct Object '+structName+' = {\'a\','+arr.length+','+unionName+'};\n';
	controller.in_scope_len.current = controller.in_scope.length;
	return structName;
}

module.exports = buildFunctions = function(tree, result, argNames, context, controller){
	if(tree.get('type') === 'value' && LETTERS.contains(tree.get('value'))){
		result += ''+argNames[controller.arg_map[tree.get('value')]];
	}
	else if(tree.get('type') === 'value'){
		result += makeIntObject(tree.get('value'), controller);
	}
	else if(tree.get('type') === 'string'){
		result += makeStringObject(tree.get('value'), controller);
	}
	else if(tree.get('type') === 'array'){
		result += makeArrayObject(tree.get('value'), controller);
	}
	else if(tree.get('type') === 'custom' && controller.defined[tree.get('value')] !== undefined){
		if(controller.defined[tree.get('value')].type === 'function' ||
			controller.defined[tree.get('value')].type === 'class'){

			if(controller.defined[tree.get('value')].type === 'class' || tree.get('switch') === 'let'){
				// if the function is a class, we need to save the result in a set object
				var objectName = controller.variables.newVariable();
				result += 'struct Object '+objectName+' = ';
				controller.defined[tree.get('name')] = {name: objectName, type: 'set', clss: _.result(controller.defined[tree.get('value')], 'label')};
			}
			result += controller.defined[tree.get('value')].name + '(';
			for(var i = 0; i < tree.size(); i++){
				result = buildFunctions(tree.children[i], result, argNames, tree, controller);
				if(i !== tree.children.length-1){
					result += ',';
				}
			}
			result += ')';	
		} else {
			var parentFunc = controller.defined[context.get('value')];
			var currentVal = controller.defined[tree.get('value')];
			if(!!parentFunc && parentFunc.restriction !== undefined){
			    if(parentFunc.restriction.contains(currentVal.clss)){
					result += controller.defined[tree.get('value')].name;
			    } else {
			    	ERRORS.add('\nERROR: Set of class '+currentVal.clss+' not compatible with function '+context.get('value')+'\n')
			    }
			} else {
				result += controller.defined[tree.get('value')].name;
			}
		}
	}
	else if(tree.get('type') === 'function' && tree.data.value !== '?'){
		result += sys.map[tree.get('value')];
		for(var i = 0; i < tree.size(); i++){
			result = buildFunctions(tree.children[i], result, argNames, tree, controller);
			if(i !== tree.size()-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.get('value') === '?'){
		var argsText = (argNames !== undefined) ? helpers.argNameText(argNames, false) : '';
		var argsTextInner = (argNames !== undefined) ? helpers.argNameText(argNames, true) : '';
		var arg_one = tree.children[1], arg_two = tree.children[2];
		var condition = tree.children[0];
		var arg_one_name = controller.variables.newVariable(), arg_two_name = controller.variables.newVariable();
		var wrapper_name = controller.variables.newVariable();
		var isShow;
		var head = '';

		var arg_one_func_body = buildFunctions(arg_one,'',argNames, null, controller);

		var arg_two_func_body = buildFunctions(arg_two,'',argNames, null, controller);
		
		controller.declarations += helpers.makeDeclaration(wrapper_name, argNames.length);
		var func_body = buildFunctions(condition,'',argNames, null, controller);
		head += 'struct Object '+wrapper_name+'('+argsText+'){\n'+IN_SCOPE+
			'struct Object truthval = '+func_body+';\nstruct Object result;\n'+
			'if(truthval.dat.i == 1){\nresult = '+arg_one_func_body+';\n'+
			'} else {\nresult='+arg_two_func_body+';\n} return result;\n};\n';
		
		controller.in_scope = '';
		tail = ''+wrapper_name+'('+argsTextInner+')';
		controller.pre_main += head;
		result += tail;
	}
	return result;
};