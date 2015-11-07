module.exports = {
	makeIntObject: makeIntObject,
	makeStringObject: makeStringObject,
	makeArrayObject: makeArrayObject
}

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