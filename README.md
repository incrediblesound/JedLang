JedLang
=======

JedLang is a crazy lisp-like languge that I made up for fun. While it is not very readable, it is intended to be very terse and easy to use. It compiles to C.

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

Core functions:    
\+ (X, Y) -> returns sum    
\- (X, Y) -> returns difference    
\* (X, Y) -> returns product    
/  (X, Y) -> divides X and Y    
@  (X) -> prints value of X to console    
^  (X, Y) -> prepends X onto Y, where Y is an array    
_  (X, Y) -> returns member of set Y at index X    
\> (X, Y) -> returns true if X is greater than Y    
<  (X, Y) -> returns true if X is less than Y   
=  (X, Y) -> returns true if X equals Y    
!  (X, Y) -> returns true if X doesn't equal Y
?  (X, Y, Z) -> returns Y if X is true, otherwise returns Z    
|  (X) -> returns X    
.  (X) -> returns length of X, where X is an array or a set    

Define a custom function with def. The def command goes like this:

```shell
(def <name> <arguments> <function body>)
```
Make sure to use X Y or Z for you argument names, they correspond to the first, second and third arguments of a function invocation.    

There is another kind of custom function that uses core functions. There is reduce (REDC), array (ARRY), filter (FLTR) and each (EACH).    
    
They are used like this:

```shell
(def <name> REDC <iterator>) // takes an array as input
(def <name> ARRY <iterator>) // takes a number of iterations and (X) element to iterate
(def <name> FLTR <test>) // takes a boolean function and a set (X) to iterate over
(def <name> EACH <iterator>) // takes an array or set (X) as input
```
The iterator in REDC can take a lowercase letter to stand in for the element at the current index during iteration. The other functions use X to stand for the arguments used to invoke the function. Here is a set of examples to demonstrate function definitions, not that definitions should always come at the top of a file, they are arranged here differently for purposes of demonstration. For working examples look in the examples directory of this repo.

```shell
(def sum REDC (+ e))
(@ (sum [1,2,3,4])) //=> 10
(def len REDC (+ 1))
(@ (len [1,2,3,4])) //=> 4

(def count ARRY (+ X 1))
(@ (count 4 0)) //=> [1,2,3,4]

(def avg X (/ sum len))
(@ (avg (count 4 0))) //=> 2.5

(def tot X (^ (sum X) X))
(@ (tot [1,2,3,4])) //=> [10,1,2,3,4]
(def all X (^ (avg X) (tot X)))
(@(all [1,2,3,4])) //=> [2.5,10,1,2,3,4]
```

Filter can only be used on sets:
```shell
(set plant1 {"healthy", 31})
(set plant2 {"healthy", 9})
(set plant3 {"unhealthy", 13})
(set plants {plant1, plant2, plant3})
(def healthy FLTR (= (_ 0 X) "healthy")) //=> returns a set of {plant1, plant2}
```
Each can be used with both arrays and sets:
```shell
(set jim {"James" 23})
(set bob {"Bob" 21})
(set dan {"Dan" 25})
(set employees {jim bob dan})
(def incr EACH (+ X 1))
(def see EACH (@ (_ 0 X)))

(see employees) //=> James Bob Dan
(@(incr [1,2,3,4,5,6])) //=> [2, 3, 4, 5, 6, 7]
```
Booleans
--------
There are functions that output booleans:
```shell
(@ (> 4 3)) //=> True
(@ (< 1 0)) //=> False
(@ (= 1 1)) //=> True
```
The equality operator checks arrays and sets to see if the all members are equal:
```shell
(set james {"James" "Edwards"})
(set jim {"James" "Bergson"})

(@ (= [1,2,4,3] [1,2,3,4])) //=> False
(@ (= james jim)) //=> False
```

The conditional function takes a boolean function as its first argument:
```shell
(@ (? (> (avg [1,2,3,4]) 1) 10 0)) //=> 10

(def wow X Y (? (> X Y) (@ "wham") (@ "whoozle")))
(wow 4 3) //=> "wham"
```
The conditional function can return functions, as in the two print functions above, or values like in the implementation of fibonnaci below:

```shell
(def low X (? (> X 0) 1 0))
(def fib X (? (< X 3) (low X) (+ (fib (- X 1)) (fib (- X 2)))))
```
Sets
----

Sets are not sets in the mathematical sense, they are just groupings of mixed type values. Sets can have set members:

```shell
(set james {"James", 31, "Developer"})
(set mary {"Mary", 29, "Architect"})
(set john {"John", 25, "Intern"})
(set employees {james, mary, john})

(def fst X (_ 0 X))
(def lst X (_ (- (. X) 1) X))
(def job X Y (@ (lst (_ X Y))))

(@ (_ 0 (fst employees))) //=> "James"
(job (- (. employees) 1) employees) //=> "Intern"
```

CLASSES
-------
Classes are basically just functions that return sets. When you define a class, you can use X, Y and Z for arguments and any other value, including sets, for elements of the return set that will be the same for each set returned by the class function.

The following is an example taken directly from example file #10 in the examples directory, another example may be found in example file #9.
```shell
// camellia is a plant with genus camellia and species X
(def cmlia CLSS { "camellia", X})

// teacea is a plant of family Teaceae and genus/species pair X
(def teaceae CLSS { "Teaceae", X})

// make a tea object, i.e. { "camellia", "sinensis" }
(set tea (cmlia "sinensis"))

// make a full tea object { "Teaceae", { "camellia", "sinensis" }}
(set tea_full (teaceae tea))
(@ (_ 0 tea_full)) //=> "Teacea"
```

USE
---
Clone this repository and cd into the directory. Write a JedLang file and give it a .jhe extension. To compile and run use the following pattern:

```shell
node parser.js <path/to/filename>
```
The above command will create both filename.out and output.c, and it assumes you do not include the extension with the filename. Running the code is just like running any other .out file, it is just compiled c code:
```shell
./<filename>.out
```
