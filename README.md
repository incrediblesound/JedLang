jedLang
=======

My first language! Woohoo! It's pretty simple so far, but it can do some cool stuff:

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

Iterate over a list with EACH, inside the iterator a letter stands for the list item, otherwise use an integer.

```shell
(def sum EACH (+ e) NULL 0)
(def len EACH (+ 1) NULL 0)
(def avg X (/ sum len))

(> (sum [1,2,3])) //=> 6
(> (avg [1,2,3,4])) //=> 2.5
```
This one appends the sum of an array onto the beginning if the array:
```shell
(def tot X (^ sum X))
(> (tot [1,2,3,4])) //=> [10,1,2,3,4]
```
Lets tack the average on for good measure:
```shell
(def all X (^ avg tot))
(all [1,2,3,4]) //=> [2.5,10,1,2,3,4]
```