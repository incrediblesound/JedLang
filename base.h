#include <stdio.h>
#include <string.h>

#define TRUTHY "True"
#define FALSY "False"

int add(int, int);
int sub(int, int);
int mult(int, int);
int div(int, int);
int showInt(int);
int showChar(char*);
struct Array append(int, struct Array);
struct Bool greater(int, int);
struct Bool less(int, int);

struct Array {
	int *body;
	int len;
};


// BOOLEANS

int showBool(char b){
	int val = strcmp(b, 't');
	if(strcmp(b, ))
	printf("%s\n", b.value);
	return 0;
};

struct Bool greater(int a, int b){
	char result;
	if(a > b){
		result = 't'
	} else {
		result = 'f'
	}
	return result;
};

struct Bool less(int a, int b){
	char result;
	if(a < b){
		result = 't'
	} else {
		result = 'f'
	}
	return result;
};

int condition(char boolean, int a, int b){
	int result;
	int compare = strcmp(boolean, "t");
	if(compare == 0){
		result = a;
	} else {
		result = b;
	}
	return result;
}

// MATH

int add(int x, int y){
	int r;
	r = x + y;
	return r;
};

int sub(int x, int y){
	int r;
	r = x - y;
	return r;
};

int mult(int x, int y){
	int r;
	r = x * y;
	return r;
};

int div(int x, int y){
	int r;
	r = x / y;
	return r;
};

int showInt(int n){
	printf("%d\n", n);
	return 0;
};

// ARRAYS

int showArray(struct Array a){
	printf("[");
	for(int i = 0; i < a.len; ++i){
		if(i < (a.len-1)){
			printf("%d, ", a.body[i]);
		} else {
			printf("%d", a.body[i]);
		}
	}
	printf("]\n");
	return 0;
};

struct Array append(int num, struct Array a){
	a.len = a.len + 1;
	for(int n = (a.len-1); n >= 0; --n){
		if(n == 0){
			a.body[0] = num;
		} else {
			a.body[n] = a.body[n-1];
		}
	}
	return a;
};

int showChar(char *h){
	printf("%s\n", h);
	return 0;
};
