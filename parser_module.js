var Tree = require('./tree.js').Tree;
var Set = require('./set.js').Set;

var letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
var LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
var numbers = new Set(['1','2','3','4','5','6','7','8','9','0']);
var funcs = new Set(['+','-','*','/','>','<','^','_','@','?','|','.','=','!']);
var patterns = new Set(['(',')','[',']','"']);
var special_funcs = new Set(['ARRY','REDC','FLTR','EACH']);
var custom = new Set([]);
var anyChar = new Set(numbers.append(patterns).append(funcs).append(letters).append(LETTERS).data);

module.exports = function(state, stack, defs){
	//have to import custom function names from initial parsing step
	custom.setData(defs);
	while(state.i < state.body.length) {
		var name, current;

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
				if(state.scope.get('type') !== undefined){
					valNode = state.scope.insert();
					valNode.set('type','custom');
					valNode.set('value',name);
				} else {
					state.scope.set('type','custom');
					state.scope.set('value', name);	
				}
			}
			else if(LETTERS.contains(current)){
				var val = state.idx();
				valNode = state.scope.insert();
				valNode.set('type','value');
				valNode.set('value', val);
			}
			else if(letters.contains(current)){
				var val = state.idx();
				valNode = state.scope.insert();
				valNode.set('type','value');
				valNode.set('value', val);
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
				name = state.take_name();
				custom.add(name);
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
					defn.set('action', state.take_next());
					defn.set('iterator', state.take_func());
					state.next();
				}
				if(state.idx() === ')'){
					stack.push(defn);
				}
			}
			else if(state.chunk(3) === 'set'){
				current = state.advance(4);
				name = state.take_name();
				custom.add(name);
				current = state.idx();
				var defset = new Tree();
				defset.set('type','setdef');
				defset.set('name', name);
				var content = state.take_brackets();
				defset.set('value', content);
				stack.push(defset);
			}
		}
		state.incr();
	}
	return stack;
};