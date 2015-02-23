var fs = require('fs');
var sys = require('./func.js');
var Set = require('./set.js').Set;
var Tree = require('./tree.js').Tree;
var exec = require('child_process').exec;

var functions = {};
functions.Tree = Tree;
funcs = new Set(['+','-','*','/','>']);
letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);

CURRENT_TYPE = null;

var variables = {
	vars: {},
	newVariable: function(){
		var result = '';
		for(var i = 0; i < 16; i++){
			result += letters.rnd();
		}
		if(this.vars[result] !== undefined){
			return this.newVariable();
		} else {
			return result;
		}
	}
};

module.exports = function(stack, name){
	var command;
	var result = '';
	createFuncDefs(stack);
	stack = replaceCustomFuncs(stack);
	identifyPrintFuncs(stack);
	while(stack.length){
		command = stack.shift();
		result = buildFunctions(command, result);
		result += ';';
	};
	result = '#include \"base.h\"\n\nint main(){'+ result + '};';
	fs.writeFileSync('output.c', result);
	exec('gcc output.c -o '+name+'.out', function(){
		exec('rm -rf output.c');
		return;
	});
};


function buildFunctions(tree, result){
	if(tree.data.type === 'value' || tree.data.type === 'string'){
		result += tree.data.value;
	}
	else if(tree.data.type === 'array'){
		var arrayName = variables.newVariable();
		var structName = variables.newVariable();
		var newStruct = 'int '+arrayName+'['+tree.data.value.length+'] = {'+tree.data.value.toString()+'};';
		newStruct += 'struct Array '+structName+';'+structName+'.body = '+arrayName+';';
		newStruct += structName+'.len = '+tree.data.value.length+';';
		result = newStruct + result;
		result += structName;
	}
	else if(tree.data.type === 'function'){
		result += sys.map[tree.data.value][0];
		for(var i = 0; i < tree.children.length; i++){
			result = buildFunctions(tree.children[i], result);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
	}
	return result;
};

function createFuncDefs(stack){
	while(stack[0].data.type === 'funcdef'){
		var tree = stack.shift();
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
					body += 'child = child.insert();';
					body += 'if(Array.isArray(root.children[0].data.value)){child.set("type","array");}else';
					body += '{child.set("type","value")}'
					body += 'child.set("value",root.children[0].data.value);';
				}
				else if(LETTERS.contains(args[i])){
					body += 'var child = tree.insert();'
					body += 'if(Array.isArray(root.children['+placeholders+'].data.value)){child.set("type","array");}else';
					body += '{child.set("type", "value");}'
					body += 'child.set("value",root.children['+placeholders+'].data.value);';
					placeholders++;
				}
			}
			body += 'return mainTree';
			var func = new Function('root',body);
			functions[tree.data.name] = func;
		}
	}
	return;
};

var replaceCustomFuncs = function replaceCustomFuncs(stack){
	for(var i = 0; i < stack.length; i++){
		if(stack[i].data.type === 'custom'){
			stack[i] = functions[stack[i].data.value](stack[i]);
		} 
		if(stack[i].children.length){
			for(var k = 0, l = stack[i].children.length; k < l; k++){
				stack[i].children[k] = recurse(stack[i].children[k]);
			}
		}
	}
	return stack;

	function recurse(tree){
		if(tree.data.type === 'custom'){
			tree = functions[tree.data.value](tree);
		}
		if(tree.children.length){
			for(var i = 0, l = tree.children.length; i < l; i++){
				tree.children[i] = recurse(tree.children[i]);
			}
		}
		return tree;
	};
};

function identifyPrintFuncs(stack){
	for(var i = 0; i < stack.length; i++){
		if(stack[i].data.value === '@'){
			changePrintFunc(stack[i]);
		}
		descend(stack[i]);
	}
	function descend(tree){
		for(var k = 0; k < tree.children.length; k++){
			if(tree.children[k].data.value === '@'){
				changePrintFunc(tree.children[k]);
			}
			if(tree.children[k].length){
				descend(tree.children[k]);
			}
		}
	}
};

function changePrintFunc(tree, root){
	root = root || tree;
	var type;
	for(var k = 0; k < tree.children.length; k++){
		if(tree.children[k].data.type === 'function'){
			type = sys.map[tree.children[k].data.value][1];
			if(root.data.value === '@'){
				if(type === 'integer'){
					root.data.value = '>i';
				}
				else if(type === 'array'){
					root.data.value = '>a';
				}
				else if(type === 'string'){
					root.data.value = '>c';
				}
				else if(type === 'boolean'){
					root.data.value = '>b';
				}
			}
			return;
		} 
		else if(tree.children[k].data.type === 'string'){
			root.data.value = '>c';
		}
		else if(tree.children[k].data.type === 'array'){
			root.data.value = '>a';
		}
		if(tree.children[k].length && root.data.value === '@'){
			changePrintFunc(tree.children[k], root);
		}
	}
};