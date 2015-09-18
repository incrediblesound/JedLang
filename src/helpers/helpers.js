module.exports = {
	argNameText: argNameText,
	makeDeclaration: makeDeclaration,
	makeObjectInstance: makeObjectInstance,
	getType: getType,
	stringToArray: stringToArray,
	printList: printList
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