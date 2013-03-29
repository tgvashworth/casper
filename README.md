# capishe

Helpers and handlers for building jsonp APIs in express

[![build status](https://secure.travis-ci.org/phuu/capishe.png)](http://travis-ci.org/phuu/capishe)

## example

The following examples assume this:

```javascript
// express 'app' available
var capishe = require('capishe');
```

### noops

Send a noop:

```javascript
// res.jsonp({}) is sent
app.get('/', capishe.noop());
```

With custom data:

```javascript
// res.jsonp({ hello: 'world' }) is sent
app.get('/', capishe.noop({
  hello: 'world'
}));
```

### database

Send data from db with appropriate 200, 500 or 404:

```javascript
app.get('/', function (req, res) {
  YourModel
    .find()
    .exec(capishe.db(req, res));
});
```

### checks

Check for the presence of a particular URL parameter:

```javascript
// calls next() becuase present
app.get('/:testParam',
        capishe.check.params('testParam'),
        capishe.noop());
```

400 errors becuase of missing parameter

```javascript
app.get('/',
        capishe.check.params('testParam'),
        capishe.noop());
```

## install

`npm install capishe`

## license

MIT