JedLang
=======

JedLang is a crazy lisp-like languge that I made up for fun. It compiles to C.

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

There is another kind of def that uses some core functions, for now there is reduce (REDC) and array (ARRY). They are used like this:

```shell
(def <name> REDC <iterator>) // takes an array as input
(def <name> ARRY <iterator>) // takes a number of iterations and (X) element to iterate
```
The iterator in REDC can take a lowercase letter to stand in for the element at the current index during iteration. The iterator in ARRY can take uppercase letters to stand for the arguments used to invoke the function. For example:
```shell
(def sum REDC (+ e))
(@ (sum [1,2,3,4])) //=> 10
(def len REDC (+ 1))
(@ (len [1,2,3,4])) //=> 4

(def count ARRY (+ X 1))
(@ (count 4 0)) //=> [1,2,3,4]

(def avg X (/ sum len))
(@ (avg (count 4 0))) //=> 2.5
```
This one appends the sum of an array onto the beginning of the array:
```shell
(def tot X (^ (sum X) X))
(@ (tot [1,2,3,4])) //=> [10,1,2,3,4]
```
Lets tack the average on for good measure:
```shell
(def all X (^ (avg X) (tot X)))
(@(all [1,2,3,4])) //=> [2.5,10,1,2,3,4]
```

Booleans
--------
Of course there are booleans:
```shell
(@ (> 4 3)) //=> True
(@ (< 1 0)) //=> False
```
And a conditional function that takes a boolean function as its first argument:
```shell
(? <boolean func> <return if true> <return if false>)

(@ (? (> (avg [1,2,3,4]) 1) 10 0)) //=> 10

(def wow X Y (? (> X Y) (@ "wham") (@ "whoozle")))
(wow 4 3) //=> "wham"
```
The conditional function can return functions, as in the two print functions above, or values like in the implementation of fibonnaci below:

```shell
(def low X (? (> X 0) 1 0))
(def fib X (? (< X 3) (low X) (+ (fib (- X 1)) (fib (- X 2)))))
```

USE
---

Write a JedLang file and name it anything but give it a .jhe extension. To compile and run use the following pattern:

```shell
node parser.js <path/to/filename>

node ./<filename>.js
```
