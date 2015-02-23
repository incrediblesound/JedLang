module.exports = {
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