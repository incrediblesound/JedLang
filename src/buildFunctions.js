var _ = require('lodash');
var sys = require('./helpers/func.js');
var chars = require('./helpers/chars.js');
var basicTypes = require('./basicTypes.js');
var funcs = chars.funcs();
var letters = chars.letters();
var LETTERS = chars.LETTERS();
var VARIABLES = chars.VARIABLES();
var ERRORS = chars.ERRORS();

module.exports = buildFunctions = function(tree, result, argNames, context, controller){
	var treeType = tree.get('type');
	var treeValue = tree.get('value');

	if(treeType === 'value' && LETTERS.contains( treeValue )){
		result += ''+argNames[controller.arg_map[ treeValue ]];
	}
	else if(treeType === 'value'){
		result += basicTypes.makeIntObject(treeValue, controller);
	}
	else if(treeType === 'string'){
		result += basicTypes.makeStringObject(treeValue, controller);
	}
	else if(treeType === 'array'){
		result += basicTypes.makeArrayObject(treeValue, controller);
	}
	else if(treeType === 'custom' && controller.defined[ treeValue ] !== undefined){
		var definition = controller.defined[ treeValue ];

		if(definition.type === 'function' ||
			definition.type === 'class'){

			if(definition.type === 'class' || tree.get('switch') === 'let'){
				// if the function is a class, we need to save the result in a set object
				var objectName = controller.variables.newVariable();
				result += 'struct Object '+objectName+' = ';
				controller.defined[tree.get('name')] = {name: objectName, type: 'set', clss: _.result(controller.defined[tree.get('value')], 'label')};
			}
			result += controller.defined[ treeValue ].name + '(';
			for(var i = 0; i < tree.size(); i++){
				result = buildFunctions(tree.children[i], result, argNames, tree, controller);
				if(i !== tree.children.length-1){
					result += ',';
				}
			}
			result += ')';	
		} else {
			var parentFunc = controller.defined[context.get('value')];

			if(!!parentFunc && !!parentFunc.restriction){
			    if(parentFunc.restriction.contains(definition.clss)){
					result += controller.defined[tree.get('value')].name;
			    } else {
			    	ERRORS.add('\nERROR: Set of class '+definition.clss+' not compatible with function '+context.get('value')+'\n')
			    }

			} else {
				result += controller.defined[tree.get('value')].name;
			}
		}
	}
	else if(treeType === 'function' && tree.data.value !== '?'){
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