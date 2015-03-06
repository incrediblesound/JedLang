var parser = require('./parser_module.js');
var Tree = require('./tree.js').Tree;
var stateFactory = require('./state.js');
var functionsFactory = function(){
	var obj = {};
	obj.Tree = Tree;
	obj.replaceVars = replaceVars;
	obj.buildFunc = function(string){
		var state = stateFactory();
		state.body = string;
		var tree = parser(state, []);
		return tree[0];
	}
	return obj;
}

replaceVars = function(tree, element){
	recurse(tree);
	return tree;

	function recurse(tree){
		if(tree.data.type === 'value' && letters.contains(tree.data.value)){
			tree.data.value = element;
		}
		if(tree.children.length){
			for(var i = 0, l = tree.children.length; i < l; i++){
				recurse(tree.children[i]);
			}
		}
	};
};

module.exports = functionsFactory;