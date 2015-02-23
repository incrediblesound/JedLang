module.exports = {
	map: {
		'+': ['add(', 'integer'],
		'-': ['sub(', 'integer'],
		'*': ['mult(', 'integer'],
		'/': ['div(', 'integer'],
		'>c': ['showChar(','string'],
		'>i': ['showInt(','integer'],
		'>a': ['showArray(','array'],	
		'^': ['append(','array'],
		'_': ['first(','array']
	},
	sys: {
		add: function(x, y){ return x + y;},
		sub: function(x, y){ return x - y;},
		mult: function(x, y){ return x * y;},
		div: function(x, y){ return x / y;},
		print: function(val){ return console.log(val);},
		append: function(val, array){ var result = []; result.push(val); return result.concat(array);},
		first: function(array){ return array[0];}
	}
};