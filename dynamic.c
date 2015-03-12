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

int show(struct Object *obj){
	if(obj->type == 's'){
		printf("%s\n", obj->dat.s);
	}
	else if(obj->type == 'i'){
		printf("%d\n", obj->dat.i);
	}
	else if(obj->type == 'f'){
		printf("%f\n", obj->dat.f);
	}
	else if(obj->type == 'b'){
		char result[10];
		strcpy(result, obj->dat.i == 0 ? "False" : "True");
		printf("%s\n", result);
	}
	else if(obj->type == 'a'){
		printf("[");
		for(int i = 0; i < obj->length; ++i){
			if(i < (obj->length-1)){
				printf("%d, ", obj->dat.ia[i]);
			} else {
				printf("%d", obj->dat.ia[i]);
			}
		}
		printf("]\n");
	}
	return 0;
};
int setInt(struct Object *obj, int num){
	obj->type = 'i';
	obj->dat.i = num;
	return 0;
};
int setFloat(struct Object *obj, float num){
	obj->type = 'f';
	obj->dat.f = num;
	return 0;
};
int setString(struct Object *obj, char *str){
	obj->type = 's';
	obj->dat.s = str;
	return 0;
};

struct Object *add(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = a->dat.i + b->dat.i;
	} else {
		a->dat.f = a->dat.f + b->dat.f;
	}
	return a;
};

struct Object *sub(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = a->dat.i - b->dat.i;
	} else {
		a->dat.f = a->dat.f - b->dat.f;
	}
	return a;
};

struct Object *mult(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = (a->dat.i) * (b->dat.i);
	} else {
		a->dat.f = (a->dat.f) * (b->dat.f);
	}
	return a;
};

struct Object *mult(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = (a->dat.i) \ (b->dat.i);
	} else {
		a->dat.f = (a->dat.f) \ (b->dat.f);
	}
	return a;
};

struct Object *greater(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = (a->dat.i) > (b->dat.i) ? 1 : 0;
	} else {
		a->dat.f = (a->dat.f) > (b->dat.f) ? 1 : 0;
	}
	a->type = 'b';
	return a;	
};

struct Object *less(struct Object *a, struct Object*b){
	if(a->type == 'i'){
		a->dat.i = (a->dat.i) < (b->dat.i) ? 1 : 0;
	} else {
		a->dat.f = (a->dat.f) < (b->dat.f) ? 1 : 0;
	}
	a->type = 'b';
	return a;	
};

struct Object *identity(struct Object *a){
	return a;
};

struct Object *append(struct Object *a, struct Object*b){
	b->length = b->length+1;
	int frst = a->dat.i;
	int temp, insert;
	for(int i = 0; i < b->length; i++){
		if(i == 0){
			temp = b->dat.ia[0];
			b->dat.ia[0] = frst;
		} else {
			insert = temp;
			temp = b->dat.ia[i];
			b->dat.ia[i] = insert;
		}
	}
	b->type = 'a';
	return b;
};
// struct Object *_(struct Object *a, struct Object*b){};

int main(){
	char hey[50];
	strcpy(hey, "Hello! I love everything about the world!");
	union Data d;
	d.s = hey;
	struct Object obj = {'s',0, d};
	show(&obj);

	setInt(&obj, 8);
	show(&obj);

	setFloat(&obj, 12.12);
	show(&obj);

	setString(&obj, &hey[0]);
	show(&obj);

	//test adding integers
	union Data dt;
	dt.i = 4;
	struct Object obj_b = {'i',0, dt};
	show(add(&obj, &obj_b));

	//test compare integers
	union Data d;
	d.i = 7;
	struct Object obj = {'i',0,d};
	union Data dt;
	dt.i = 10;
	struct Object obj_b = {'i',0,dt};
	show(greater(&obj, &obj_b));

	//test show array and append
	union Data d;
	int arry[5] = { 1, 2, 3, 4, 5 };
	d.ia = arry;
	struct Object obj = {'a', 5, d};
	union Data dt;
	dt.i = 10;
	struct Object obj_a = {'i',0, dt};
	show(append(&obj_a, &obj));
	return 0;
};