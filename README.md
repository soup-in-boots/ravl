
# Table of Contents

1.  [ravl](#org9b7a59c)
    1.  [Installation](#org7746606)
    2.  [Usage](#org2dbd690)
        1.  [Create a tree](#org8f63d3b)
        2.  [Use a custom comparator](#org8cc5ade)
        3.  [Insert elements](#org156e226)
        4.  [Test membership, retrieve values](#org38dfebc)
        5.  [Remove an item](#org2cdeb05)
        6.  [Take an item](#org84cc579)
    3.  [TODO](#org2b01cb5)
        1.  [More APIs](#orgf8fcedf)
        2.  [More documentation](#orgacaf535)
        3.  [Tests](#org4d3ab34)
    4.  [Contributing](#orgbf9b22f)
        1.  [PRs welcome](#org725debb)
        2.  [README.md](#org66bc2cd)


<a id="org9b7a59c"></a>

# ravl

A fast, lightweight, persistent AVL tree implementation written typescript.


<a id="org7746606"></a>

## Installation

    npm install ravl


<a id="org2dbd690"></a>

## Usage


<a id="org8f63d3b"></a>

### Create a tree

    const {Tree} = require('ravl');
    let a = new Tree();


<a id="org8cc5ade"></a>

### Use a custom comparator

    function compare({key: a}, {key: b}) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
    
    let a = new Tree({compare})


<a id="org156e226"></a>

### Insert elements

    a = a.add({key: 'a', value: 1});
    a = a.add({key: 'b', value: 2});


<a id="org38dfebc"></a>

### Test membership, retrieve values

    a.has({key: 'b'}) // {key: 'a', value: 2}
    a.has({key: 'c'}) // false


<a id="org2cdeb05"></a>

### Remove an item

    a = a.remove({key: 'b'});


<a id="org84cc579"></a>

### Take an item

    let [{value}, newA] = a.take({key: 'c'});


<a id="org2b01cb5"></a>

## TODO


<a id="orgf8fcedf"></a>

### More APIs


<a id="orgacaf535"></a>

### More documentation


<a id="org4d3ab34"></a>

### Tests


<a id="orgbf9b22f"></a>

## Contributing


<a id="org725debb"></a>

### PRs welcome


<a id="org66bc2cd"></a>

### README.md

Write in the org file. Export to markdown.

