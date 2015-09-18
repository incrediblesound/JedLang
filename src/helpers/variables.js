var chars = require('./chars.js');
var letters = chars.letters();

module.exports = function(){
	return {
		vars: {},
		newVariable: function(){
			var result = '';
			for(var i = 0; i < 8; i++){
				result += letters.rnd();
			}
			if(this.vars[result] !== undefined){
				return this.newVariable();
			} else {
				return result;
			}
		}
	};
}