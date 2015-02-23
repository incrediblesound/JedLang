var Set = function(array){
	this.data = array;	
};
Set.prototype.contains = function(item){
	return this.data.indexOf(item) > -1;
};
Set.prototype.get = function(idx){
	return this.data[idx];
};
Set.prototype.append = function(set){
	return new Set(this.data.concat(set.data));
};
Set.prototype.add = function(item){
	this.data.push(item);
};
Set.prototype.rnd = function(){
	var index = Math.round(Math.random()*this.data.length);
	return this.get(index);
}

module.exports = {
	Set: Set,
}