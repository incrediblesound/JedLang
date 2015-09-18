var _ = require('lodash');
var chars = require('./chars.js');

var VARIABLES = chars.VARIABLES();

module.exports = findClassName = function(tree, args, idx, controller){
	idx = idx || 0;
	args = args || [];
	var result = [], temp;
	if(controller.defined[tree.get('value')] !== undefined && controller.defined[tree.get('value')].type === 'class'){
		result.push(tree.get('value'));
		tree.set('value', VARIABLES.get(idx));
		tree.set('type', 'value');
		args.push(VARIABLES.get(idx));
		idx++
	} else {
		for(var i = 0; i < tree.children.length; i++){
			temp = findClassName(tree.children[i], args, idx, controller);
			if(temp.length > 0){
				result.push(temp);
			}
		}
	}
	return _.flatten(result);
}