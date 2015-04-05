# include <stdio.h>
# include <string.h>

int main(){

char str = 'b';
int val = strcmp(&str, "a");
# if (val == 0)
printf("hello");
# else
printf("not working");
# endif
return 0;
}
