# include <stdio.h>
# include <string.h>

union Data {
	int i;
	float f;
	char *s;
	int *ia;
};

struct Object { 
	char type;
	int length;
	union Data dat;
};

struct Object show(struct Object obj){
	if(obj.type == 's'){
		printf("%s\n", obj.dat.s);
	}
	else if(obj.type == 'i'){
		printf("%d\n", obj.dat.i);
	}
	else if(obj.type == 'f'){
		printf("%f\n", obj.dat.f);
	}
	else if(obj.type == 'b'){
		char result[10];
		strcpy(result, obj.dat.i == 0 ? "False" : "True");
		printf("%s\n", result);
	}
	else if(obj.type == 'a'){
		printf("[");
		for(int i = 0; i < obj.length; ++i){
			if(i < (obj.length-1)){
				printf("%d, ", obj.dat.ia[i]);
			} else {
				printf("%d", obj.dat.ia[i]);
			}
		}
		printf("]\n");
	}
	return obj;
};
struct Object createInt(int num){
	union Data d;
	d.i = num;
	struct Object obj = {'i',0,d};
	return obj;
};
struct Object createFloat(float num){
	union Data d;
	d.f = num;
	struct Object obj = {'f',0,d};
	return obj;
};
struct Object createString(char *str){
	union Data d;
	d.s = str;
	struct Object obj = {'s',0,d};
	return obj;
};

struct Object createArray(int *ia){
	union Data d;
	d.ia = ia;
	struct Object obj = {'a',1,d};
	return obj;
};

struct Object getInt(struct Object obj){
	union Data d;
	if(obj.type == 'i'){
		return createInt(obj.dat.i);
	}
	else {
		return createInt(obj.dat.ia[0]);
	}
};



struct Object add(struct Object a, struct Object b){
	if(a.type == 'i'){
		a.dat.i = a.dat.i + b.dat.i;
	} else {
		a.dat.f = a.dat.f + b.dat.f;
	}
	return a;
};

struct Object sub(struct Object a, struct Object b){
	if(a.type == 'i'){
		a.dat.i = a.dat.i - b.dat.i;
	} else {
		a.dat.f = a.dat.f - b.dat.f;
	}
	return a;
};

struct Object mult(struct Object a, struct Object b){
	if(a.type == 'i'){
		a.dat.i = (a.dat.i) * (b.dat.i);
	} else {
		a.dat.f = (a.dat.f) * (b.dat.f);
	}
	return a;
};

struct Object div(struct Object a, struct Object b){
	if(a.type == 'i'){
		a.dat.i = a.dat.i / b.dat.i;
	} else {
		a.dat.f = a.dat.f / b.dat.f;
	}
	return a;
};

struct Object greater(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'i',0, dt};

	if(a.type == 'i'){
		obj.dat.i = (a.dat.i) > (b.dat.i) ? 1 : 0;
	} else {
		obj.dat.f = (a.dat.f) > (b.dat.f) ? 1 : 0;
	}
	obj.type = 'b';
	return obj;	
};

struct Object less(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'i',0, dt};

	if(a.type == 'i'){
		obj.dat.i = (a.dat.i) < (b.dat.i) ? 1 : 0;
	} else {
		obj.dat.f = (a.dat.f) < (b.dat.f) ? 1 : 0;
	}
	obj.type = 'b';
	return obj;	
};

struct Object identity(struct Object a){
	return a;
};

struct Object append(struct Object a, struct Object b){
	b.length = b.length+1;
	b.dat.ia[b.length-1] = a.dat.i;	
	b.type = 'a';
	return b;
};

struct Object prepend(struct Object a, struct Object b){
	b.length = b.length+1;
	int frst = a.dat.i;
	int temp, insert;
	for(int i = 0; i < b.length; i++){
		if(i == 0){
			temp = b.dat.ia[0];
			b.dat.ia[0] = frst;
		} else {
			insert = temp;
			temp = b.dat.ia[i];
			b.dat.ia[i] = insert;
		}
	}
	b.type = 'a';
	return b;
};