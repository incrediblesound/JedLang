JedLang
=======

JedLang is a non-human-readable, non-expressive, functional language that compiles to C. It's kinda like lisp, and it is very concise because I like brevity and it's my language so there.

Lispy Math
----------
```shell
(+ 3 2)
(/ 4 2)
(- 4 (/4 2))
```

Output
------
```shell
(@ (+3 2)) //=> 5
(@ "Hello, world.") //=> Hello, world.
```

Functions
---------

Define a function with def. The def command goes like this:

```shell
(def <name> <arguments> <function body>)
```
Make sure to use X Y or Z for you argument names, they correspond to the first, second and third arguments of a function invocation.    
There is another kind of def that use core functions, for now there is only reduce, and it is called EACH... it is used like this:

```shell
(def <name> EACH <iterator> NULL <value>)
```

The iterator will be used recursively on the contents of the list. The iterator function takes a single value, either a placeholder for the current value of the list or a numeric value. This iterator: (+ e) means add the next value of the list to the sum, while this one: (+ 1) means add one to the sum. NULL is what you give the function that takes the last index.

Here are some of examples:

```shell
(def sum EACH (+ e) NULL 0)
(def len EACH (+ 1) NULL 0)
(def avg X (/ sum len))

(@ (sum [1,2,3])) //=> 6
(@ (avg [1,2,3,4])) //=> 3 (float math coming soon)
```
This one appends the sum of an array onto the beginning of the array:
```shell
(def tot X (^ sum X))
(@ (tot [1,2,3,4])) //=> [10,1,2,3,4]
```
Lets tack the average on for good measure:
```shell
(def all X (^ avg tot))
(all [1,2,3,4]) //=> [3,10,1,2,3,4]
```

Booleans
--------
Of course there are booleans:
```shell
(@ (> 4 3)) //=> True
(@ (< 1 0)) //=> False
```
And a conditional function that works like this:
```shell
(? <boolean func> <return if true> <return if false>)

(@ (? (> (avg [1,2,3,4]) 1) 10 0)) //=> 10

(def wow X Y (? (> X Y) (@ "wham") (@ "whoozle")))
(wow 4 3) //=> "wham"
```
The conditional function can take function arguments, as in the two print functions above, but the two return values have to be of the same type, so no funny stuff ya' hear?

USE
---

Write a JedLang file and name it anything but give it a .jhe extension. To compile and run use the following pattern:

```shell
node parser.js <path/to/filename>
./<filename>.out

node parser.js mycode
./mycode.out //=> stuff happens
```
