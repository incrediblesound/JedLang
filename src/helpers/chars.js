var Set = require('./set.js').Set;

var characterFunctions = {
	letters: function(){
		return new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);	
	},
	LETTERS: function(){
		return new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);	
	},
	numbers: function(){
		return new Set(['1','2','3','4','5','6','7','8','9','0']);	
	},
	funcs: function(){
		return new Set(['+','-','*','/','>','<','^','_','@','?','|','.','=','!','$']);	
	},
	special_funcs: function(){
		return new Set(['ARRY','REDC','FLTR','EACH','CLSS']);	
	},
	patterns: function(){
		return new Set(['(',')','[',']','"']);	
	},
	custom: function(){
		return new Set([]);	
	},
	anyChar: function(){
		return new Set(characterFunctions.numbers().append(characterFunctions.patterns()).append(characterFunctions.funcs()).append(characterFunctions.letters()).append(characterFunctions.LETTERS()).data);	
	},
	VARIABLES: function(){
		return new Set(['X','Y','Z']);	
	},
	ERRORS: function(){
		return new Set();
	}
}

module.exports = characterFunctions;