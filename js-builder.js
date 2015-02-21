var fs = require('fs');
var sys = require('./func.js');
var Set = require('./set.js').Set;
var Tree = require('./tree.js').Tree;

var functions = {};
functions.Tree = Tree;
funcs = new Set(['+','-','*','/','>']);
letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);

module.exports = function(stack){
	var command;
	var result = 'var sys = require("./func.js").sys;';
	while(stack.length){
		command = stack.shift();
		result += buildFunctions(command);
		result += ';';
	};
	fs.writeFileSync('output.js', result);
	return
}

function buildFunctions(tree){
	if(tree.data.type === 'value'){
		if(Array.isArray(tree.data.value)){
			return '\['+tree.data.value+'\]';
		} else {
			return tree.data.value;
		}
	} 
	else if(tree.data.type === 'function'){
		var result = sys.map[tree.data.value];
		for(var i = 0; i < tree.children.length; i++){
			result += buildFunctions(tree.children[i]);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
		return result;
	}
	else if(tree.data.type === 'custom'){
		tree = functions[tree.data.value](tree);
		return buildFunctions(tree);
	}
	else if(tree.data.type = "funcdef"){
			var funcData = tree.data.iterator.replace(/\(|\)/g,'').split(' ');
			var funcName = funcData[0];
		if(tree.data.action === 'EACH'){
			var funcElement = funcData[1];
			body  = 'root = root.children[0];var mainTree = new this.Tree();';
			body += 'var tree = mainTree;';
			body += 'tree.set("type", "function"); tree.set("value","'+funcName+'");';
			body += 'for(var i = 0; i < root.data.value.length; i++){';
			if(letters.contains(funcElement)){
				body += 'var child = tree.insert(); child.set("type","value"); child.set("value",root.data.value[i]);';
			} else {
				body += 'var child = tree.insert(); child.set("type","value"); child.set("value",'+funcElement+');';
			}
			body += 'if(i === root.data.value.length-1){';
			body += 'var child = tree.insert(); child.set("type","value"); child.set("value",'+tree.data["null"]+');}';
			body += 'else{tree = tree.insert(); tree.set("type", "function"); tree.set("value","'+funcName+'");}}';
			body += 'return mainTree;';
			var func = new Function('root',body);
			functions[tree.data.name] = func;
		} else {
			funcData.shift();
			var args = funcData;
			body  = 'var mainTree = new this.Tree();';
			body += 'var tree = mainTree;';
			body += 'tree.set("type", "function"); tree.set("value","'+funcName+'");';
			var placeholders = 0;
			for(var i = 0; i < args.length; i++){
				if(functions[args[i]] !== undefined){
					body += 'var child = tree.insert();';
					body += 'child.set("type","custom");child.set("value","'+args[i]+'");';
					body += 'child = child.insert();child.set("type","value");';
					body += 'child.set("value",root.children[0].data.value);';
				}
				else if(LETTERS.contains(args[i])){
					body += 'var child = tree.insert();'
					body += 'child.set("type", "value");child.set("value",root.children['+placeholders+'].data.value);';
					placeholders++;
				}
			}
			body += 'return mainTree';
			var func = new Function('root',body);
			functions[tree.data.name] = func;
		}
		return '';
	}
}