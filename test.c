#include <stdio.h>
// #include "base.h"

struct Array {
	int *body;
	int len;
};

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
}

int main(){
	// printf("%d\n", add(1,4));
	// printf("%d\n", sub(4,1));
	int origin[4] = {1,2,2,3};
	struct Array myArray;
	myArray.body = origin;
	myArray.len = 4;
	myArray = append(9, myArray);
	showArray(myArray);
	return 0;
};