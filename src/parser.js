var fs = require('fs');
var Tree = require('./helpers/tree.js').Tree;
var builder = require('./interpreter.js');
var chars = require('./helpers/chars.js');

var anyChar = chars.anyChar();
var numbers = chars.numbers();
var funcs = chars.funcs();
var special_funcs = chars.special_funcs();

var custom_types = {};

module.exports = parser = function(textControl, stack, custom){
	var l = textControl.body.length,
    	current,
    	valNode;

	while(textControl.i < l) {
    var name;
    
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
				if(textControl.scope.get('type') !== undefined && custom_types[name] !== 'funcdef'){
					valNode = textControl.scope.insert();
					valNode.set('type','custom');
					valNode.set('value', name);
				} else {
					textControl.scope.set('type','custom');
					textControl.scope.set('value', name);	
				}
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
				if(!!textControl.scope){
					if(textControl.scope.get('type') === 'custom' && textControl.chunk(2) === '))' && 
					   textControl.scope.get('name') !== undefined){
						textControl.incr();
					}
					if(textControl.scope.parent === null){
						stack.push(textControl.scope);
					} 
					textControl.scope = textControl.scope.parent;
				}
			}
			else if(textControl.chunk(3) === 'def'){
				current = textControl.advance(4);
				name = textControl.take_name();
				custom.add(name);
				custom_types[name] = 'funcdef';
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
					defn.set('arguments', textControl.take_args());
					defn.set('iterator', textControl.take_func());
					textControl.next();
				}
				if(textControl.idx() === ')'){
					stack.push(defn);
				}
			}
			else if(textControl.chunk(3) === 'set' || textControl.chunk(3) === 'let'){
				var isLet = textControl.chunk(3) === 'let';
				current = textControl.advance(4);
				name = textControl.take_name();
				custom.add(name);
				custom_types[name] = 'setdef';
				current = textControl.idx();
				var defset = new Tree();
				defset.set('type','setdef');
				defset.set('name', name);
				if(textControl.chunk(3).indexOf('(') !== -1){
					if(textControl.scope === null){
						textControl.scope = defset;
					} else {
						textControl.scope.set('type','setdef');
						textControl.scope.set('name', name);
					}
					if(isLet){
						textControl.scope.set('switch', 'let')
					}
					textControl.next_paren();
					
				} else {
					var content = textControl.take_brackets();
					defset.set('value', content);
					stack.push(defset);
				}
			}
		}
		textControl.incr();
	}
	return stack;
}
