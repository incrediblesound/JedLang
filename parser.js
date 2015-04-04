var fs = require('fs');
var Tree = require('./tree.js').Tree;
var Set = require('./set.js').Set;
var builder = require('./js-builder.js');
var program = require('commander');
var state = require('./state.js')();

program.parse(process.argv);
var body = fs.readFileSync('./'+program.args[0]+'.jhe').toString();
state.body = body;

var letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
var LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
var numbers = new Set(['1','2','3','4','5','6','7','8','9','0']);
var funcs = new Set(['+','-','*','/','>','<','^','_','@','?','|','.','=','!','$']);
var special_funcs = new Set(['ARRY','REDC','FLTR','EACH','CLSS']);
var patterns = new Set(['(',')','[',']','"']);
var custom = new Set([]);
var anyChar = new Set(numbers.append(patterns).append(funcs).append(letters).append(LETTERS).data);

var stack = [];
var custom_types = {};
var l = body.length,
    current,
    valNode;

var fileName = program.args[0].split('/');
fileName = fileName[fileName.length-1];
var stack = parser(state, stack);
builder(stack, fileName, custom.data);

function parser(state, stack){
	while(state.i < l) {
    var name;
    
		current = state.next();
		if(anyChar.contains(current)){
			if(current === '(' && state.chunk(4) !== '(def' && state.chunk(4) !== '(set'){
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
				name = state.next_word();
				state.advance(name.length-1);
				if(state.scope.get('type') !== undefined && custom_types[name] !== 'funcdef'){
					valNode = state.scope.insert();
					valNode.set('type','custom');
					valNode.set('value', name);
				} else {
					console.log(state.scope)
					state.scope.set('type','custom');
					state.scope.set('value', name);	
				}
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
				if(!!state.scope){
					if(state.scope.get('type') === 'custom' && state.chunk(2) === '))' && 
					   state.scope.get('name') !== undefined){
						state.incr();
					}
					if(state.scope.parent === null){
						stack.push(state.scope);
					} 
					state.scope = state.scope.parent;
				}
			}
			else if(state.chunk(3) === 'def'){
				current = state.advance(4);
				name = state.take_name();
				custom.add(name);
				custom_types[name] = 'funcdef';
				current = state.idx();
				var defn = new Tree();
				defn.set('type','funcdef');
				defn.set('name', name);
				state.incr();
				var special = state.chunk(4);
				if(state.idx() !== ')' && special_funcs.contains(special)){
					state.advance(4);
					defn.set('action',special);
					defn.set('iterator', state.take_func());
					state.next();
					if(state.idx() !== ')' && state.chunk(4) === 'NULL'){
						state.advance(4);
						defn.set('null', state.take_next());
						state.next();
					}
				} else {
					defn.set('arguments', state.take_args());
					defn.set('iterator', state.take_func());
					state.next();
				}
				if(state.idx() === ')'){
					stack.push(defn);
				}
			}
			else if(state.chunk(3) === 'set' || state.chunk(3) === 'let'){
				var isLet = state.chunk(3) === 'let';
				current = state.advance(4);
				name = state.take_name();
				custom.add(name);
				custom_types[name] = 'setdef';
				current = state.idx();
				var defset = new Tree();
				defset.set('type','setdef');
				defset.set('name', name);
				if(state.chunk(3).indexOf('(') !== -1){
					console.log('scope ', state.scope)
					if(state.scope === null){
						state.scope = defset;
					} else {
						state.scope.set('type','setdef');
						state.scope.set('name', name);
					}
					if(isLet){
						state.scope.set('switch', 'let')
					}
					state.next_paren();
					
				} else {
					var content = state.take_brackets();
					defset.set('value', content);
					stack.push(defset);
				}
			}
		}
		state.incr();
	}
	return stack;
}
