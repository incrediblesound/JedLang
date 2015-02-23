jedLang
=======

JedLang is a non-human-readable, non-expressive, functional language that compiles to C. It's kinda like lisp, and it is very concise because I like brevity and it's my language so there.

lispy math
----------
```shell
(+ 3 2)
(/ 4 2)
(- 4 (/4 2))
```

Output
------
```shell
(> (+3 2)) //=> 5
(> "Hello, world.") //=> Hello, world.
```

Functions
---------

Iterate over a list with EACH, inside the iterator a letter stands for the list item, otherwise use an integer. Perceptive readers will notice that EACH is actually reduce. I'll probably change that soon...



```shell
(def sum EACH (+ e) NULL 0)
(def len EACH (+ 1) NULL 0)
(def avg X (/ sum len))

(> (sum [1,2,3])) //=> 6
(> (avg [1,2,3,4])) //=> 3 (float math coming soon)
```
This one appends the sum of an array onto the beginning of the array:
```shell
(def tot X (^ sum X))
(> (tot [1,2,3,4])) //=> [10,1,2,3,4]
```
Lets tack the average on for good measure:
```shell
(def all X (^ avg tot))
(all [1,2,3,4]) //=> [3,10,1,2,3,4]
```

USE
---

Write a JedLang file and name it anything but give it a .jhe extension. To compile and run use the following pattern:

```shell
node parser.js <path/to/filename>
./<filename>.out
```