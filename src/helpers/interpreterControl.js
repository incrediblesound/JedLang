var chars = require('./chars');
var variables = require('./variables.js')();
module.exports = function(){
	return {
		defined: {},
		arg_map: {
			'X': 0,
			'Y': 1,
			'Z': 2
		},
		declarations: '',
		pre_main: '',
		in_scope: '',
		in_scope_len: {prev: 0, current: 0},
		defs: chars.custom(),
		variables: variables,
		getScopeChunk: function(){
			return this.in_scope.substring(this.in_scope_len.prev, this.in_scope_len.current);
		},
		removeScopeChunk: function(){
			this.in_scope = this.in_scope.substring(0, this.in_scope_len.prev);
			this.in_scope_len.prev = this.in_scope.length;
			this.in_scope_len.current = this.in_scope.length;
		},
		setPreviousLength: function(){
			this.in_scope_len.prev = this.in_scope.length;
		},
		setCurrentLength: function(){
			this.in_scope_len.current = this.in_scope.length;
		}
	}
}