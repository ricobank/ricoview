import { test } from 'tapzero'

import { jams } from '../jams.js'

import { readFileSync, readdirSync } from 'fs'

test('passing files and their JSON equivalents', _=> {
    const subpath = './test/pass'
    readdirSync(subpath).forEach(filename => {
        const extension = filename.split('.').slice(-1)[0]
	// Only read JAMS files, and we require a corresponding JSON verison.
        if (extension === "jams") {
	    test(`${subpath}/${filename}`, t=> {
		const jamspath = `${subpath}/${filename}`
	        const jams_o = jams(readFileSync(jamspath, {encoding: 'utf8'}))
	        const jsonfile = readFileSync(jamspath.replace('jams', 'json'))
	        const json_o = JSON.parse(jsonfile)
	        t.deepEqual(Object.keys(jams_o), Object.keys(json_o))
	        for (const key in json_o) {
	    	    t.ok(jams_o[key] !== undefined)
	    	    t.deepEqual(json_o[key], jams_o[key])
	        }
	    })
        }
    })
})

test('failing files', t=> {
    const subpath = './test/fail'
    readdirSync(subpath).forEach(filename => {
		test(`${subpath}/${filename}`, t => {
        const extension = filename.split('.').slice(-1)[0]
	const filepath = `${subpath}/${filename}`
        if (extension === "jams") {
	    t.throws(
	        _ => jams(readFileSync(filepath, {encoding: 'utf8'})),
		new RegExp('(Syntax error)|(Unexpected token .* in JSON)|(Unexpected end of input)')
	    )
	}
	})
    })
})

/*
A humble note on how a newline (and escaped sequences in general) is kept in-file vs in-memory.

---

> r = encoding => require('fs').readFileSync('patch.jams', encoding)

// Let's assume the file has "\n".
// The code reads 2 bytes: a backslash and alphabet "n".
// Thus, the reading kept the backslash character.
> r(null)                                      
<Buffer 5c 6e>                                 
> let x = r('utf8'); [x, x.length]             // Same content, but the bytes get decoded according to utf8 to a string of length 2
['\\n', 2]                                     

// In contrast, parsing with JSON.parse removes backslash. Because JSON spec states "\\" followed by "n" should be interpreted as newline.
> let j = JSON.parse(String.raw`"${x}"`); [j, j.length]
['\n', 1]                                      

---

Therefore,
- reading a file with UTF8 encoding "escapes"/treats backslash as standalone.
- JSON.parse "un-escapes"/parses valid escape sequence (e.g. "\\" + "n") into 1 character.
- More? 
  - json.org
  - https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/
*/
