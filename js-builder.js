var fs = require('fs');

module.exports = function(stack){
	var command;
	var result = 'console.log(';
	while(stack.length){
		command = stack.shift();
		result += buildFunctions(command, result);
		if(stack.length !== 0){
			result += ",";
		}
	};
	result += ')';
	fs.writeFileSync('output.js', result);
	return
}

function buildFunctions(tree, string){
	if(tree.data.type === 'value'){
		return tree.data.value;
	} else {
		var opening = 'function(){ return ';
		for(var i = 0; i < tree.children.length; i++){
			opening += buildFunctions(tree.children[i]);
			if(i !== tree.children.length-1){
				opening += tree.data.value;
			}
		}
		opening += ';}()'
		return opening;
	}
}