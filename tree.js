var Tree = function(parent){
	this.data = {};
	this.children = [];
	this.parent = parent || null;
}

Tree.prototype.insert = function(){
	var child = new Tree(this);
	this.children.push( child );
	return child;
}

Tree.prototype.set = function(prop, value){
	this.data[prop] = value;
}

module.exports = {
	Tree: Tree
}