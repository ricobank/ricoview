This package is a thin wrapper around the [ebnf](https://www.npmjs.com/package/ebnf) package by [menduz](https://github.com/menduz).

It locks a version and exposes the usage that I most often use (you probably want to generate the parser at package load time):

```
const read = require('easygram')(`
    <your grammar>
`)
const ast = read('<string to parse')
```

This is the same as:

```
const enbf = require('ebnf')
const rules = ebnf.Grammars.W3C.getRules(`
    <your grammar>
`)
const parser = new ebnf.Parser(rules)
const ast = ser.getAst(s)
```


The inner package is at `_ebnf`:

```
const { _ebnf} = require('easygram')
```
