# casper

Helpers and handlers for building (jsonp) APIs in [Express](http://expressjs.com).

[![build status](https://secure.travis-ci.org/phuu/casper.png)](http://travis-ci.org/phuu/casper)

All caspers methods return a function that can be used in the Express callback chain, or as callbacks for your database.

## example

The following examples assume this:

```javascript
// express 'app' available
var casper = require('casper');
```

### Basic handlers

Send an empty opject:

```javascript
// res.jsonp({}) is sent
app.get('/', casper.noop());
```

Or return some custom data:

```javascript
// res.jsonp({ hello: 'world' }) is sent
app.get('/', casper.noop({
  hello: 'world'
}));
```

### Database callbacks

#### casper.db

`casper.db` returns a function to be used as a database callback. It assumes the first argument is an `err` and the second is the `data` is has to send – an array or an object.

It takes Express' `req` and `res` as arguments:

```javascript
casper.db(req, res)
```

For example:

```javascript
app.get('/', function (req, res) {
  YourModel
    .find()
    .exec(casper.db(req, res));
});
```

It can also take a callback which, if present, is called instead of sending data directly back to the client.

With a callback:

```javascript
app.get('/', function (req, res) {
  YourModel
    .find()
    .exec(casper.db(req, res, function (err, data) {
      // Do something with data
    }));
});
```

If it is passed an error, it will pass that on to the client with a 500 status code. If it recieves no data, or an empty array, it will return the data it recieved with a 404 status.

### Checks & filters

#### capser.check.body

Check for the presence of data in the body using a key:

```javascript
// body is { testKey: "Hello" }
// calls next() becuase present
app.get('/',
        casper.check.body('testKey'),
        casper.noop());
```

If the data is missing from the body it sends a 400 error, detailing the missing parameter:

```javascript
app.get('/',
        casper.check.body('nonExistantKey'),
        casper.noop());

// results in
res.jsonp(400, { error: 'Missing nonExistantKey from body.' });
```

#### capser.rm.body

Remove a key from the body:

```javascript
// body is { testKey: "Hello", otherKey: "World" }
app.get('/',
        casper.rm('testKey'),
        casper.noop());

// afterwards body is { otherKey: "World" }
```

#### casper.allow.body

Whitelist a key or array of keys allowed on the body.

```javascript
// body is { testKey: "Hello", otherKey: "World" }
app.get('/',
        casper.allow.body('otherKey'),
        casper.noop());

// afterwards body is { test: "Hello" }
```

With an array:

```javascript
// body is { testKey: "Hello", otherKey: "World", unwantedKey: "World" }
app.get('/',
        casper.allow.body(['testKey', 'otherKey']),
        casper.noop());

// afterwards body is { testKey: "Hello", otherKey: "World" }
```

## install

`npm install casper`

## license

MIT