# casper

Helpers and handlers for building jsonp APIs in express

[![build status](https://secure.travis-ci.org/phuu/casper.png)](http://travis-ci.org/phuu/casper)

## example

The following examples assume this:

```javascript
// express 'app' available
var casper = require('casper');
```

### noops

Send a noop:

```javascript
// res.jsonp({}) is sent
app.get('/', casper.noop());
```

With custom data:

```javascript
// res.jsonp({ hello: 'world' }) is sent
app.get('/', casper.noop({
  hello: 'world'
}));
```

### database

Send data from db with appropriate 200, 500 or 404:

```javascript
app.get('/', function (req, res) {
  YourModel
    .find()
    .exec(casper.db(req, res));
});
```

### checks

Check for the presence of a particular URL parameter:

```javascript
// calls next() becuase present
app.get('/:testParam',
        casper.check.params('testParam'),
        casper.noop());
```

400 errors becuase of missing parameter

```javascript
app.get('/',
        casper.check.params('testParam'),
        casper.noop());
```

## install

`npm install casper`

## license

MIT