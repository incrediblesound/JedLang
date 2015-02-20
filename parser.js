var fs = require('fs');
var Tree = require('./tree.js').Tree;
var Set = require('./set.js').Set;
var builder = require('./js-builder.js');

var body = fs.readFileSync('./body.jhe').toString();

letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
numbers = new Set(['1','2','3','4','5','6','7','8','9','0']);
funcs = new Set(['+','-','*','/']);
patterns = new Set(['(',')']);
anyChar = new Set(numbers.append(patterns).append(funcs).append(letters).data);

var stack = [];

var state = {
	scope: null,
	i: 0,
	body: body,
	incr: function(){
		this.i += 1;
	}
	idx: function(){
		return this.body[this.i];
	},
	chunk: function(ahead){
		return this.body.slice(this.i, this.i+ahead);
	},
	advance: function(num){
		this.i += num;
		return this.idx();
	},
	take: function(num){
		var temp = this.i;
		this.i += num;
		return this.body.slice(temp, this.i);
	},
	take_name: function(){
		var name = '';
		while(this.idx() === ' '){
			this.indcr();
		}
		while(letters.contains(this.idx())){
			name += this.idx();
			this.incr();
		}
	}
}

var l = body.length,
    current,
    valNode;
while(state.i < l) {
	current = state.idx();
	if(anyChar.contains(current)){
		if(current === '('){
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
		else if(numbers.contains(current)){
			var num = '';
			while(numbers.contains(state.idx())){
				num = num + state.idx();
				++state.i;
			}
			--i;
			valNode = state.scope.insert();
			valNode.set('type','value');
			valNode.set('value', num);
		}
		else if(current === ')'){
			if(state.scope.parent === null){
				stack.push(state.scope);
			}
			state.scope = state.scope.parent;
		}
		else if(state.chunk(3) === 'def'){
			current = state.advance(4);
			var name = '';
			while(letters.contains(state.idx())){
				name += state.idx();
				state.incr();
			}
			var defn = new Tree();
			defn.set('type','funcdef');
			defn.set('name', name);
			state = incr_i(state);
			if(state.body.slice(i, i+4) === 'EACH'){
				defn.set('action','each')

			}
		}
	}
	++i;
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
