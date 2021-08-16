// run test just by typing node test_deepTrim.js
var deepTrim = require('./deepTrim');
var assert = require('assert');


assert.deepStrictEqual(deepTrim(null),  null,'null');
assert.deepStrictEqual(deepTrim(''),  '', 'empty string');
assert.deepStrictEqual(deepTrim('abc'), 'abc', 'small string');
assert.deepStrictEqual(deepTrim('   abc'), 'abc', 'small string with leading spaces');
assert.deepStrictEqual(deepTrim('   abc   '), 'abc', 'small string with both ends spaced');
assert.deepStrictEqual(deepTrim(1), 1, 'number');
assert.deepStrictEqual(deepTrim([]), [], 'empty array');
assert.deepStrictEqual(deepTrim(['abc   ']), ['abc'], 'array of 1 string');
assert.deepStrictEqual(deepTrim(['  abc   ']), ['abc'], 'array of both ended space string');
assert.deepStrictEqual(deepTrim([ { a:'   abc   ', b: 123, c: [ '  def  ' ] }]) , [{a:'abc', b:123, c:['def']}], 'complex array with obj');
assert.deepStrictEqual(deepTrim([ { a:'   abc   ', b: 123, c: [ '  def  ' ], e:null, f:[1,'adf',null] }]) , 
                                [{a:'abc', b:123, c:['def'],e:null, f:[1,'adf',null]}], 
                                'complex array with obj');
