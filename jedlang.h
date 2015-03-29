# include <stdio.h>
# include <string.h>

union Data {
	int i;
	float f;
	char *s;
	int *ia;
	struct Object *oa;
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
	else if(obj.type == 'd'){
		printf("%s\n","{");
		for(int i = 0; i < obj.length; ++i){
			if(i < (obj.length-1)){
				show(obj.dat.oa[i]);
			} else {
				show(obj.dat.oa[i]);
			}
		}
		printf("%s\n","}");
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

struct Object getFloat(struct Object obj){
	union Data d;
	if(obj.type == 'f'){
		return createFloat(obj.dat.f);
	}
	else {
		return createFloat(obj.dat.ia[0]);
	}
};

struct Object member(struct Object num, struct Object b){
	int ni = num.dat.i;
	return b.dat.oa[ni];
};

struct Object length(struct Object a){
	union Data dat;
	dat.i = a.length;
	struct Object obj = {'i',0,dat};
	return obj;
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
		a.dat.i = a.dat.i * b.dat.i;
	} else {
		a.dat.f = a.dat.f * b.dat.f;
	}
	return a;
};

struct Object divide(struct Object a, struct Object b){
	if(a.type == 'i'){
		a.dat.i = a.dat.i / b.dat.i;
	} else {
		a.dat.f = a.dat.f / b.dat.f;
	}
	return a;
};

struct Object greater(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'b',0, dt};

	if(a.type == 'i'){
		obj.dat.i = a.dat.i > b.dat.i ? 1 : 0;
	} else {
		obj.dat.f = a.dat.f > b.dat.f ? 1 : 0;
	}
	return obj;	
};

struct Object equal(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'b',0, dt};
	int isTrue;
	if(a.type == 'i'){
		obj.dat.i = a.dat.i == b.dat.i ? 1 : 0;
	}
	else if(a.type == 'f'){
		obj.dat.i = a.dat.f == b.dat.f ? 1 : 0;
	}
	else if(a.type == 's'){
		obj.dat.i = (strcmp(a.dat.s, b.dat.s) == 0) ? 1 : 0;
	}
	else if (a.type == 'o'){
		isTrue = 1;
		for(int i = 0; i < a.length; i++){
			struct Object temp = equal(a.dat.oa[i], b.dat.oa[i]);
			isTrue = (temp.dat.i == 1 && isTrue == 1) ? 1 : 0;
		}
		obj.dat.i = isTrue;
	}
	else if (a.type == 'a'){
		isTrue = 1;
		for(int i = 0; i < a.length; i++){
			isTrue = (a.dat.ia[i] == b.dat.ia[i] && isTrue == 1) ? 1 : 0;
		}
		obj.dat.i = isTrue;
	}
	return obj;
};

struct Object not_equal(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'b',0, dt};
	int isTrue;
	if(a.type == 'i'){
		obj.dat.i = a.dat.i != b.dat.i ? 1 : 0;
	}
	else if(a.type == 'f'){
		obj.dat.i = a.dat.f != b.dat.f ? 1 : 0;
	}
	else if(a.type == 's'){
		obj.dat.i = (strcmp(a.dat.s, b.dat.s) != 0) ? 1 : 0;
	}
	else if (a.type == 'o'){
		isTrue = 1;
		for(int i = 0; i < a.length; i++){
			struct Object temp = not_equal(a.dat.oa[i], b.dat.oa[i]);
			isTrue = (temp.dat.i == 1 && isTrue == 1) ? 1 : 0;
		}
		obj.dat.i = isTrue;
	}
	else if (a.type == 'a'){
		isTrue = 0;
		for(int i = 0; i < a.length; i++){
			isTrue = (a.dat.ia[i] == b.dat.ia[i] && isTrue == 0) ? 0 : 1;
		}
		obj.dat.i = isTrue;
	}
	return obj;
};

struct Object less(struct Object a, struct Object b){
	union Data dt;
	struct Object obj = {'b',0, dt};

	if(a.type == 'i'){
		obj.dat.i = a.dat.i < b.dat.i ? 1 : 0;
	} else {
		obj.dat.f = a.dat.f < b.dat.f ? 1 : 0;
	}
	return obj;	
};

struct Object identity(struct Object a){
	return a;
};

struct Object set_append(struct Object a, struct Object b){
	struct Object arr[b.length+1];
	for(int i = 0; i < b.length+1; i++){
		if(i < b.length){
			arr[i] = b.dat.oa[i];
		} else {
			arr[i] = a;
		}
	}
	b.dat.oa = arr;
	b.length = b.length + 1;
	return b;
};

struct Object append(struct Object a, struct Object b){
	if(a.type == 'o'){
		return set_append(a, b);
	} else {
		int arr[b.length+1];
		for(int i = 0; i < b.length+1; i++){
			if(i < b.length){
				arr[i] = b.dat.ia[i];
			} else {
				arr[i] = a.dat.i;
			}
		}
		b.dat.ia = arr;
		b.length = b.length + 1;
		return b;
	}
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
