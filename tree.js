var Tree = function(parent){
	this.data = {};
	this.children = [];
	this.parent = parent || null;
}

Tree.prototype.insert = function(child){
	child = child || new Tree(this);
	this.children.push( child );
	return child;
}

Tree.prototype.set = function(prop, value){
	this.data[prop] = value;
}

Tree.prototype.get = function(prop){
	return this.data[prop];
}

Tree.prototype.size = function(){
	return this.children.length;
}

module.exports = {
	Tree: Tree
}