# delta-json
Delta json, diff json, json changes, json history.

# Usage

```
const Delta = require('diff-delta-json')

let delta = new Delta();
```

+ get changes in human readable format
```$xslt
let changes = delta.getChanges (obj1, obj2)
``` 

+ get delta json (can be used in partial update)
```$xslt
let changes = delta.getChanges (obj1, obj2)
``` 

+ get history changes
```$xslt
let changes = delta.getChanges (obj1, obj2, userName) 
```

#Options

Labels and ignore keys can be implemented by Option, default:
```$xslt
{
  labels:{
    beforeLabel: 'before',
    afterLabel: 'after',
    deletedLabel: 'deleted',
    createdLabel: 'created',
    chagedLabel: 'changed'
  },
  ignore:[] // list of keys to ignore  
} 
```

#Examples

```
const Delta = require('./delta');
const util = require('util');

const obj1 = {
  name: 'test',
  prop1: {
    prop2: {
      prop3: 'value1',
      prop4: ['1', '2']
    }
  }
};

const obj2 = {
  name: 'test',
  prop1: {
    prop2: {
      prop3: 'value31',
      prop4: ['1']
    }
  },
  prop5: {}
};
```

get changes in human readable format
```$xslt
const delta = new Delta();
const changes = delta.getChanges(obj1, obj2);

console.log(util.inspect(changes, false, null, true));

/* OUTPUT
{ prop1:
   { prop2:
      { prop3: { before: 'value1', after: 'value31' },
        prop4: { '1': { deleted: '2' } } } },
  prop5: { created: {} } }
*/

```

get delta json (can be used in partial update)

```
const delta = new Delta();
const delta = delta.getDelta(obj1, obj2);

console.log(util.inspect(delta, false, null, true));

/* OUTPUT
{ prop1: { prop2: { prop3: 'value31', prop4: [ '1' ] } },
  prop5: {} }
*/

```

get history changes

```
const delta = new Delta();

let userName = "Json Walker"; // anonymous if parameter isn't specified
let prevHistory = ['2020-05-14T18:04:50.872Z anonymous created property "prop1" with value "{}"'] // empty array if parameter isn't specified

let history = delta.createHistory(obj1, obj2);

console.log(history);

/* OUTPUT
[ '2020-06-14T18:04:50.871Z anonymous changed property "prop3" from value "value1" to "value31"',
  '2020-06-14T18:04:50.871Z anonymous changed property "prop4" from array "1,2" to "1"',
  '2020-06-14T18:04:50.872Z anonymous created property "prop5" with value "{}"' ]
*/

let history = delta.createHistory(obj1, obj2, userName, prevHistory);

console.log(history);

/* OUTPUT
[ '2020-05-14T18:04:50.872Z anonymous created property "prop1" with value "{}"',
  '2020-06-14T18:04:50.871Z Json Walker changed property "prop3" from value "value1" to "value31"',
  '2020-06-14T18:04:50.871Z Json Walker changed property "prop4" from array "1,2" to "1"',
  '2020-06-14T18:04:50.872Z Json Walker created property "prop5" with value "{}"' ]
*/



```