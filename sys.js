function greater(x, y){
	return x > y;
};

function less(x, y){
	return x < y;
};

function append(el, array){
	return Array.isArray(el) ? el.concat(array) : [el].concat(array);
};

function div(x, y){
	return x/y;
};

function add(){
	if(Array.isArray(arguments[1] && !Array.isArray(arguments[0]))){
		return mapAdd(arguments[0], arguments[1]);
	}
	else if(!Array.isArray(arguments[0])){
		var args = Array.prototype.slice.call(arguments);
	} else {
		args = arguments[0];
	}
	var result = 0;
	for(var i = 0, l = args.length; i < l; i++){
		result += args[i];
	}
	return result;
};

function sub(){
	if(Array.isArray(arguments[1] && !Array.isArray(arguments[0]))){
		return mapSub(arguments[0], arguments[1]);
	} else {
		var args = Array.prototype.slice.call(arguments);
		var result = args[0];
		for(var i = 1, l = args.length; i < l; i++){
			result -= args[i];
		}
		return result;
	}
};

function mapAdd(value, array){
	for(var i = 0, l = array.length; i < l; i++){
		array[i] += value;
	}
	return array;
};

function mapSub(value, array){
	for(var i = 0, l = array.length; i < l; i++){
		array[i] -= value;
	}
	return array;
};