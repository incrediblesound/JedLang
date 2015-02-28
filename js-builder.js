var fs = require('fs');
var sys = require('./func.js');
var Set = require('./set.js').Set;
var Tree = require('./tree.js').Tree;
var exec = require('child_process').exec;
var stateFactory = require('./state.js');
var parser = require('./parser_module.js');
var functions = require('./functionsFactory.js')();
var printTree = require('./printTree.js');

funcs = new Set(['+','-','*','/','>']);
letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);

DEFINED = [];
CURRENT_TYPE = null;

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

PRE_MAIN = '';
DEFS = null;
module.exports = function(stack, name, funcdefs){
	DEFS = funcdefs;
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
	result = '#include \"base.h\"\n\n'+PRE_MAIN+'int main(){'+ result + '};';
	fs.writeFileSync('output.c', result);
	exec('gcc output.c -o '+name+'.out', function(){
		// exec('rm -rf output.c');
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
	else if(tree.data.type === 'function' && tree.data.value !== '?'){
		result += sys.map[tree.data.value][0];
		for(var i = 0; i < tree.children.length; i++){
			result = buildFunctions(tree.children[i], result);
			if(i !== tree.children.length-1){
				result += ',';
			}
		}
		result += ')';
	}
	else if(tree.data.value === '?'){
		var arg_one = tree.children[1], arg_two = tree.children[2];
		var condition = tree.children[0];
		var arg_one_name = variables.newVariable(), arg_two_name = variables.newVariable();
		var wrapper_name = variables.newVariable();
		var arg_one_type = returnType(arg_one), arg_two_type = returnType(arg_two);
		var head = ''+arg_one_type+' '+arg_one_name+'(){'+arg_one_type+' '+arg_one_name+' = '+buildFunctions(arg_one,'')+'; return '+arg_one_name+';};';
		head += arg_two_type+' '+arg_two_name+'(){'+arg_two_type+' '+arg_two_name+' = '+buildFunctions(arg_two,'')+'; return '+arg_two_name+';};';
		head += arg_one_type+' '+wrapper_name+'(){ int truthval = istrue('+buildFunctions(condition,'')+');'+
		arg_one_type+' result;'+'if(truthval){ result = '+arg_one_name+'();}else{ result='+arg_two_name+'();} return result;};';
		tail = ''+wrapper_name+'()';
		PRE_MAIN = PRE_MAIN + head;
		result = result+tail;
	}
	return result;
};

function createFuncDefs(stack){
	while(stack.length && stack[0].data.type === 'funcdef'){
		var tree = stack.shift();
		if(tree.data.action === 'EACH'){
			var iterator = tree.data.iterator;
			body  = 'root = root.children[0]; var topLevel = this.buildFunc("'+iterator+'");';
			body += 'var iteratorTree = topLevel;';
			body += 'for(var i = 0; i < root.data.value.length; i++){';
			body += 'var current = root.data.value[i];';
			body += 'if(i === 0){ iteratorTree = this.replaceVars(iteratorTree, current); }';
			body += 'iteratorTree = iteratorTree.insert(this.buildFunc("'+iterator+'"));'
			body += 'iteratorTree = this.replaceVars(iteratorTree, current);'
			body += 'if(i === root.data.value.length-1){ ';
			body += 'iteratorTree = iteratorTree.insert(); iteratorTree.set("type","value");' 
			body += 'iteratorTree.set("value",'+tree.data["null"]+');}}';
			body += 'return topLevel;';
			var func = new Function('root',body);
			functions[tree.data.name] = func;
		} else {
			var state = stateFactory();
			state.body = tree.data.iterator;
			var result = parser(state, [], DEFS);
			functions[tree.data.name] = fillVariables(result[0]);
		}
	}
	return;
};

var fillVariables = function(tree){
	return function(root){
		var args = root.children;
		recurse(tree);
		return tree;
		function recurse(tree){
			if(tree.data.type === 'value' && LETTERS.contains(tree.data.value)){
				if(tree.data.value === 'X'){
					tree.data.value = root.children[0].data.value;
					tree.data.type = root.children[0].data.type;
					tree.children = root.children[0].children;
				}
				if(tree.data.value === 'Y'){
					tree.data.value = root.children[1].data.value;
					tree.data.type = root.children[1].data.type;
					tree.children = root.children[1].children;
				}
				if(tree.data.value === 'Z'){
					tree.data.value = root.children[2].data.value;
					tree.data.type = root.children[2].data.type;
					tree.children = root.children[2].children;
				}
			}
			if(tree.children.length){
				for(var i = 0, l = tree.children.length; i < l; i++){
					recurse(tree.children[i]);
				}
			}
		};
	}
};

var replaceCustomFuncs = function replaceCustomFuncs(stack){
	var temp, current;
	for(var i = 0; i < stack.length; i++){
		current = stack[i];
		if(current.data.type === 'custom' && (DEFINED.indexOf(current.data.value) === -1) ){
			DEFINED.push(current.data.value);
			stack[i] = functions[current.data.value](current);
		} 
		if(current.children.length){
			for(var k = 0, l = current.children.length; k < l; k++){
				stack[i].children[k] = recurse(current.children[k]);
			}
		}
	}
	return stack;

	function recurse(tree){
		if(tree.data.type === 'custom' && (DEFINED.indexOf(current.data.value) === -1)){
			DEFINED.push(current.data.value);
			tree = functions[tree.data.value](tree);
		}
		if(tree.children.length){
			for(var i = 0, l = tree.children.length; i < l; i++){
				tree.children[i] = recurse(tree.children[i], root);
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

function changePrintFunc(tree, root, startIdx){
	startIdx = startIdx || 0;
	root = root || tree;
	var type;
	for(var k = startIdx; k < tree.children.length; k++){
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
				else if(type === 'variable'){
					return changePrintFunc(tree.children[k], root, 1);
				}
			}
		} 
		else if(tree.children[k].data.type === 'string'){
			root.data.value = '>c';
		}
		else if(tree.children[k].data.type === 'value'){
			root.data.value = '>i';
		}
		else if(tree.children[k].data.type === 'array'){
			root.data.value = '>a';
		}
		if(tree.children[k].length && root.data.value === '@'){
			changePrintFunc(tree.children[k], root);
		}
	}
};

function returnType(tree) {
	var type;
	if(tree.data.type === 'function'){
		type = sys.map[tree.data.value][1];
		if(type === 'integer'){
			return 'int';
		}
		else if(type === 'array'){
			return 'int *';
		}
		else if(type === 'string'){
			return 'char *';
		}
		else if(type === 'boolean'){
			return 'char';
		}
		else if(type === 'variable'){
			return returnType(tree.children[1]);
		}
	}
	else if(tree.data.type === 'value'){
		return 'int';
	}
	else if(tree.data.type === 'string'){
		return 'char *';
	}
	else if(tree.data.type === 'array'){
		return 'int *';
	}
	else if(tree.data.type === 'custom'){
		return returnType(tree.children[0]);
	}
};