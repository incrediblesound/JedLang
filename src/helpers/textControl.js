var chars = require('./chars.js');

var letters = chars.letters();
var LETTERS = chars.LETTERS();
var anyChar = chars.anyChar();

module.exports = function(){
	return {
		scope: null,
		i: 0,
		body: null,
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
		next: function(){
			while(this.idx() === ' ' || /\r\n|\n|\r/.test(this.idx())){
				this.incr();
			}
			return this.idx();
		},
		next_word: function(){
			var name = '';
			var k = this.i;
			while(letters.contains(this.body[k]) || this.body[k] === '_'){
				name += this.body[k];
				++k;
			}
			return name;
		},
		next_paren: function(){
			while(this.idx() !== '('){
				this.incr();
			}
		},
		take: function(num){
			var temp = this.i;
			this.i += num;
			return this.body.slice(temp, this.i);
		},
		take_args: function(){
			var args = [];
			this.next();
			while(LETTERS.contains(this.idx()) || this.idx() === ' '){
				if(LETTERS.contains(this.idx())){
					args.push(this.idx());
				}
				this.incr();
			}
			return args;
		},
		take_brackets: function(){
			this.next();
			this.incr();
			var string = '';
			while(this.idx() !== '}'){
				string += this.idx();
				this.incr();
			}
			this.incr();
			return string.split(',');
		},
		take_classdef: function(){
			var name = '';
			this.incr();
			while(this.idx() !== '}'){
				name += this.idx();
				this.incr();
			}
			this.incr();
			name = name.replace(/\s/g,'');
			return name.split(',');
		},
		take_func: function(){
			this.next();
			if(this.idx() === '{'){
				return this.take_classdef();
			}
			var open = 1;
			var name = "(";
			this.incr();
			while(open > 0){
				if(this.idx() === '('){
					open += 1;
				}
				else if(this.idx() === ')'){
					open -= 1;
				}
				name += this.idx();
				this.incr();
			}
			return name;
		},
		take_name: function(){
			var name = '';
			this.next();
			while(letters.contains(this.idx()) || this.idx() === '_'){
				name += this.idx();
				this.incr();
			}
			return name;
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
	};	
}