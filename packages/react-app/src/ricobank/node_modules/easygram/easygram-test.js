const it = require('tapzero').test
const gram = require('./easygram')

it('gram', t=>{
    const read = gram(`
        letter ::= "k"
    `)
    const ast = read("k")
})
