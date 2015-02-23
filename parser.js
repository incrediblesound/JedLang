var fs = require('fs');
var Tree = require('./tree.js').Tree;
var Set = require('./set.js').Set;
var builder = require('./js-builder.js');
var program = require('commander')
var state = require('./state.js');

program.parse(process.argv);
var body = fs.readFileSync('./'+program.args[0]+'.jhe').toString();
state.body = body;

letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
numbers = new Set(['1','2','3','4','5','6','7','8','9','0']);
funcs = new Set(['+','-','*','/','>','^','_','@']);
patterns = new Set(['(',')','[',']','"']);
custom = new Set([]);
anyChar = new Set(numbers.append(patterns).append(funcs).append(letters).append(LETTERS).data);

var stack = [];

var l = body.length,
    current,
    valNode;
while(state.i < l) {
	current = state.next();
	if(anyChar.contains(current)){
		if(current === '(' && state.chunk(4) !== '(def'){
			if(state.scope === null){
				state.scope = new Tree();
			} else {
				state.scope = state.scope.insert();
			}
		}
		else if(funcs.contains(current)){
			state.scope.set('type','function');
			state.scope.set('value', current);
		}
		else if(custom.contains(state.next_word())){
			var name = state.next_word();
			state.advance(name.length);
			state.scope.set('type','custom');
			state.scope.set('value', name);
		}
		else if(numbers.contains(current)){
			var num = '';
			while(numbers.contains(state.idx())){
				num = num + state.idx();
				state.incr();
			}
			state.decr();
			valNode = state.scope.insert();
			valNode.set('type','value');
			valNode.set('value', num);
		}
		else if(current === '"'){
			var text = state.get_text();
			valNode = state.scope.insert();
			valNode.set('type','string');
			valNode.set('value', text);
		}
		else if(current === '['){
			var list = state.get_list();
			valNode = state.scope.insert();
			valNode.set('type','array');
			valNode.set('value', list);			
		}
		else if(current === ')'){
			if(state.scope.parent === null){
				stack.push(state.scope);
			}
			state.scope = state.scope.parent;
		}
		else if(state.chunk(3) === 'def'){
			current = state.advance(4);
			var name = state.take_name();
			custom.add(name);
			current = state.idx();
			var defn = new Tree();
			defn.set('type','funcdef');
			defn.set('name', name);
			state.incr();
			if(state.idx() !== ')' && state.chunk(4) === 'EACH'){
				state.advance(4);
				defn.set('action','EACH');
				defn.set('iterator', state.take_func());
				state.next();
				if(state.idx() !== ')' && state.chunk(4) === 'NULL'){
					state.advance(4);
					defn.set('null', state.take_next());
					state.next();
				}
			} else {
				defn.set('action', state.take_next());
				defn.set('iterator', state.take_func());
				state.next();
			}
			if(state.idx() === ')'){
				stack.push(defn);
			}
		}
	}
	state.incr();
}
var fileName = program.args[0].split('/');
fileName = fileName[fileName.length-1];
builder(stack, fileName);
