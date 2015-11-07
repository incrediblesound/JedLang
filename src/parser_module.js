var Tree = require('./helpers/tree.js').Tree;
var Set = require('./helpers/set.js').Set;
var chars = require('./helpers/chars.js');

var anyChar = chars.anyChar();
var custom = chars.custom();
var numbers = chars.numbers();
var funcs = chars.funcs();
var letters = chars.letters();
var LETTERS = chars.LETTERS();

module.exports = function(textControl, stack, defs){
	//import custom function names from initial parsing step
	if(defs !== undefined){
		custom.setData(defs.data);	
	}
	while(textControl.i < textControl.body.length) {
		var name, current;

		current = textControl.next();
		if(anyChar.contains(current)){
			if(current === '(' && textControl.chunk(4) !== '(def' && textControl.chunk(4) !== '(set'){
				if(textControl.scope === null){
					textControl.scope = new Tree();
				} else {
					textControl.scope = textControl.scope.insert();
				}
			}
			else if(funcs.contains(current)){
				textControl.scope.set('type','function');
				textControl.scope.set('value', current);
			}
			else if(custom.contains(textControl.next_word())){
				name = textControl.next_word();
				textControl.advance(name.length-1);
				if(textControl.scope.get('type') !== undefined){
					valNode = textControl.scope.insert();
					valNode.set('type','custom');
					valNode.set('value',name);
				} else {
					textControl.scope.set('type','custom');
					textControl.scope.set('value', name);	
				}
			}
			else if(LETTERS.contains(current)){
				var val = textControl.idx();
				valNode = textControl.scope.insert();
				valNode.set('type','value');
				valNode.set('value', val);
			}
			else if(letters.contains(current)){
				var val = textControl.idx();
				valNode = textControl.scope.insert();
				valNode.set('type','value');
				valNode.set('value', val);
			}
			else if(numbers.contains(current)){
				var num = '';
				while(numbers.contains(textControl.idx())){
					num = num + textControl.idx();
					textControl.incr();
				}
				textControl.decr();
				valNode = textControl.scope.insert();
				valNode.set('type','value');
				valNode.set('value', num);
			}
			else if(current === '"'){
				var text = textControl.get_text();
				valNode = textControl.scope.insert();
				valNode.set('type','string');
				valNode.set('value', text);
			}
			else if(current === '['){
				var list = textControl.get_list();
				valNode = textControl.scope.insert();
				valNode.set('type','array');
				valNode.set('value', list);			
			}
			else if(current === ')'){
				if(textControl.scope.parent === null){
					stack.push(textControl.scope);
				}
				textControl.scope = textControl.scope.parent;
			}
			else if(textControl.chunk(3) === 'def'){
				current = textControl.advance(4);
				name = textControl.take_name();
				custom.add(name);
				current = textControl.idx();
				var defn = new Tree();
				defn.set('type','funcdef');
				defn.set('name', name);
				textControl.incr();
				var special = textControl.chunk(4);
				if(textControl.idx() !== ')' && special_funcs.contains(special)){
					textControl.advance(4);
					defn.set('action',special);
					defn.set('iterator', textControl.take_func());
					textControl.next();
					if(textControl.idx() !== ')' && textControl.chunk(4) === 'NULL'){
						textControl.advance(4);
						defn.set('null', textControl.take_next());
						textControl.next();
					}
				} else {
					defn.set('action', textControl.take_next());
					defn.set('iterator', textControl.take_func());
					textControl.next();
				}
				if(textControl.idx() === ')'){
					stack.push(defn);
				}
			}
			else if(textControl.chunk(3) === 'set'){
				current = textControl.advance(4);
				name = textControl.take_name();
				custom.add(name);
				current = textControl.idx();
				var defset = new Tree();
				defset.set('type','setdef');
				defset.set('name', name);
				var content = textControl.take_brackets();
				defset.set('value', content);
				stack.push(defset);
			}
		}
		textControl.incr();
	}
	return stack;
};