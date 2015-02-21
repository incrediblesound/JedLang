var fs = require('fs');
var Tree = require('./tree.js').Tree;
var Set = require('./set.js').Set;
var builder = require('./js-builder.js');
var program = require('commander')

program.parse(process.argv);
var body = fs.readFileSync('./'+program.args[0]).toString();

letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
LETTERS = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
numbers = new Set(['1','2','3','4','5','6','7','8','9','0']);
funcs = new Set(['+','-','*','/','>','^','_']);
patterns = new Set(['(',')','[',']','"']);
custom = new Set([]);
anyChar = new Set(numbers.append(patterns).append(funcs).append(letters).append(LETTERS).data);

var stack = [];

var state = {
	scope: null,
	i: 0,
	body: body,
	advance: function(num){
		this.i += num;
		return this.idx();
	},
	chunk: function(ahead){
		return this.body.slice(this.i, this.i+ahead);
	},
	decr: function(){
		this.i -= 1;
	},
	get_list: function(){
		this.incr();
		var content = '';
		while(this.idx() !== ']'){
			content += this.idx();
			this.incr();
		}
		return content.split(',');
	},
	get_text: function(){
		this.incr();
		var result = "";
		while(this.idx() !== '"'){
			result += this.idx();
			this.incr();
		}
		return '\"'+result+'\"';
	},
	incr: function(){
		this.i += 1;
	},
	idx: function(){
		return this.body[this.i];
	},
	take: function(num){
		var temp = this.i;
		this.i += num;
		return this.body.slice(temp, this.i);
	},
	take_name: function(){
		var name = '';
		this.next();
		while(letters.contains(this.idx())){
			name += this.idx();
			this.incr();
		}
		return name;
	},
	next: function(){
		while(this.idx() === ' '){
			this.incr();
		}
		return this.idx();
	},
	take_next: function(){
		var name = '';
		this.next();
		while(anyChar.contains(this.idx()) && this.idx() !== ')'){
			name += this.idx();
			this.incr();
		}
		return name;
	},
	next_word: function(){
		var name = '';
		var k = this.i;
		while(letters.contains(this.body[k])){
			name += this.body[k];
			++k;
		}
		return name;
	},
	take_func: function(){
		this.next();
		var name = "";
		while(this.idx() !== ')'){
			name += this.idx();
			this.incr();
		}
		if(this.idx() === ')'){
			name += this.idx();
			this.incr();
			return name;
		}
	}
};

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
			valNode.set('type','value');
			valNode.set('value', text);
		}
		else if(current === '['){
			var list = state.get_list();
			valNode = state.scope.insert();
			valNode.set('type','value');
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
builder(stack);

function incr_i(state){
	while(state.body[state.i] === ' '){
		++state.i;
	}
	return state;
}

function getNumber(string, idx){
	var result = '';
	while(numbers.contains(string[idx])){
		result = result + string[idx];
		++idx;
	}
	return {result: result, index: idx};
}
