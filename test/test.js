var casper = require('../index'),
    _ = require('underscore'),
    test = require('tap').test,
    sinon = require('sinon');

// ==================================
// Fixtures
// ==================================

var res = {};
var setup = function () {
  res.send = res.json = res.jsonp = sinon.spy(function () {
    console.log.apply(console, [].slice.call(arguments));
  });
};
setup();

var app = {};
app.get = app.post = function (path) {

  var req = {};
  req.params = [];
  req.body = {
    testKey: true,
    stringKey: 'tom',
    numKey: 10,
    zeroKey: 0
  };
  req.query = {
    testQuery: true
  };

  req.params = (path.match(/[a-zA-Z]+/g) || []).reduce(function (memo, param) {
    memo[param] = true;
    return memo;
  }, {});

  console.log(req.params);

  var cbs = [].slice.call(arguments, 1),
      doNext = true;
  cbs.forEach(function (cb) {
    if (!doNext) return;
    doNext = false;
    cb(req, res, function () {
      console.log("next()");
      doNext = true;
    });
  });
};

var fakeDoc = {};
fakeDoc.save = function (cb) { return cb(null, this); };
var FakeModel = function (obj) {
  var doc = Object.create(fakeDoc);
  return _.extend(doc, obj);
};
FakeModel.find = function () {
  return {
    exec: function (cb) {
      cb(null, new FakeModel({ name: 'Fakey McFake' }));
    }
  };
};
FakeModel.findWithError = function () {
  return {
    exec: function (cb) {
      cb(new Error("Shit broke"));
    }
  };
};
FakeModel.findWithNoResults = function () {
  return {
    exec: function (cb) {
      cb(null, []);
    }
  };
};
FakeModel.findWithFalsyData = function () {
  return {
    exec: function (cb) {
      cb(null, null);
    }
  };
};

// ==================================
// Examples
// ==================================

// ==================================
// General
// ==================================
test('general', function (t) {

  t.test('send with no data', function (t) {
    setup();
    app.get('/', casper.send());
    t.ok(res.jsonp.calledOnce, 'jsonp was called');
    t.ok(res.jsonp.calledWith({}), 'jsonp was called correct data');
    t.end();
  });

  t.test('send with data', function (t) {
    setup();
    var data = { status: 'great' };
    app.get('/', casper.send(data));
    t.ok(res.jsonp.calledOnce, 'jsonp was called');
    t.ok(res.jsonp.calledWith(data), 'jsonp was called correct data');
    t.end();
  });

  t.end();

});


// ==================================
// Database
// ==================================
test('database', function (t) {

  t.test('sends data with 200', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .find()
        .exec(casper.db(req, res));
    });
    t.ok(res.jsonp.calledOnce, 'jsonp was called once');
    t.end();
  });

  t.test('sends 500 with errors', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithError()
        .exec(casper.db(req, res));
    });
    t.ok(res.jsonp.withArgs(500).calledOnce, '500 jsonp was called once');
    t.end();
  });

  t.test('sends 404 with falsey data', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithFalsyData()
        .exec(casper.db(req, res));
    });
    t.ok(res.jsonp.withArgs(404).calledOnce, '404 jsonp was called once');
    t.end();
  });

  t.test('calls errback with error data', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithError()
        .exec(casper.db(req, res, function () {}, function (err) {
          t.pass('errback was called');
          t.end();
        }));
    });
  });

  t.test('calls errback with falsey data', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithFalsyData()
        .exec(casper.db(req, res, function () {}, function (err) {
          t.pass('errback was called');
          t.end();
        }));
    });
  });

  t.end();

});

// ==================================
// Checks & filters
// ==================================
test('checks & filters', function (t) {

  t.test('generic', function (t) {

    t.test('missing parameter is caught', function (t) {
      setup();
      app.get('/',
              casper.check('params', 'testParam'),
              casper.noop());
      app.get('/:testParam',
              casper.check('params', 'testParam'),
              casper.noop());
      t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
      t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
      t.end();
    });

    t.test('missing body keys are caught', function (t) {
      setup();
      app.get('/',
              casper.check('body', ['fakeKey', 'gibberish']),
              casper.noop());
      app.get('/',
              casper.check('body', ['testKey', 'gibberish']),
              casper.noop());
      t.ok(res.jsonp.withArgs(400).calledTwice, '400 jsonp was called twice');        t.end();
    });

    t.test('missing body key is caught', function (t) {
      setup();
      app.get('/',
              casper.check('body', 'fakeKey'),
              casper.noop());
      app.get('/',
              casper.check('body', 'testKey'),
              casper.noop());
      t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
      t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
      t.end();
    });

    t.test('zero parameter is allowed', function (t) {
      setup();
      app.get('/',
              casper.check('body', 'zeroKey'),
              casper.noop());
      t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
      t.end();
    });

  });

  t.test('callback', function (t) {

    t.test('body can be matched with callback', function (t) {
      setup();
      app.get('/',
              casper.check('body', 'testKey', function (value) {
                return value === true;
              }),
              casper.noop());
      app.get('/',
              casper.check('body', 'testKey', function (value) {
                return value === 'nose';
              }),
              casper.noop());
      t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
      t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
      t.end();
    });

  });

  t.test('missing parameter is caught', function (t) {
    setup();
    app.get('/',
            casper.check.params('testParam'),
            casper.noop());
    app.get('/:testParam',
            casper.check.params('testParam'),
            casper.noop());
    t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
    t.end();
  });

  t.test('body keys can be checked', function (t) {
    setup();
    app.get('/',
            casper.check.body('fakeKey'),
            casper.noop());
    app.get('/',
            casper.check.body('testKey'),
            casper.noop());
    t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
    t.end();
  });

  t.test('zero parameter is allowed', function (t) {
    setup();
    app.get('/',
            casper.check.body('zeroKey'),
            casper.noop());
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
    t.end();
  });

  t.test('rm', function (t) {

    t.test('key is removed from body with generic rm', function (t) {
      setup();
      var spy = sinon.spy(casper.noop());
      app.get('/',
              casper.rm('body', 'testKey'),
              function (req, res) {
                t.notOk(req.body.testKey, 'Test key removed.');
                t.end();
              });
    });

    t.test('keys are removed from body with generic rm', function (t) {
      setup();
      var spy = sinon.spy(casper.noop());
      app.get('/',
              casper.rm('body', ['testKey', 'stringKey']),
              function (req, res) {
                t.notOk(req.body.testKey, 'testKey removed.');
                t.notOk(req.body.stringKey, 'stringKey removed.');
                t.end();
              });
    });

    t.test('key is removed from body', function (t) {
      setup();
      var spy = sinon.spy(casper.noop());
      app.get('/',
              casper.rm.body('testKey'),
              function (req, res) {
                t.notOk(req.body.testKey, 'Test key removed.');
                t.end();
              });
    });

  });

  t.test('only supplied key is allowed in body', function (t) {
    setup();
    var spy = sinon.spy(casper.noop());
    app.get('/',
            casper.allow.body('stringKey'),
            function (req, res) {
              t.notOk(req.body.testKey, 'Test key removed.');
              t.notOk(req.body.numKey, 'Test key removed.');
              t.end();
            });
  });

  t.test('only array of keys are allowed in body', function (t) {
    setup();
    var spy = sinon.spy(casper.noop());
    app.get('/',
            casper.allow.body(['stringKey', 'numKey']),
            function (req, res) {
              t.notOk(req.body.testKey, 'Test key removed.');
              t.end();
            });
  });

  t.test('missing query param is caught', function (t) {
    setup();
    app.get('/',
            casper.check.query('testQuery'),
            casper.noop());
    app.get('/',
            casper.check.query('missingQuery'),
            casper.noop());
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp was called once');
    t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
    t.end();
  });

  t.end();
});


// ==================================
// Logging
// ==================================
app.get('/:testParam',
        casper.log.the('params'),
        casper.noop());

app.get('/:testParam',
        casper.log.the('params.testParam'),
        casper.noop());

// ==================================
// Utils
// ==================================
test('utilities', function (t) {
  t.test('atString', function (t) {
    t.test('nested objects', function (t) {
      var res = casper.util.atString({ a: { b: 20 } }, 'a.b');
      t.equal(res, 20, 'Data in nested object retrieved correctly.');
      t.end();
    });
    t.test('nested array', function (t) {
      var res = casper.util.atString({ a: [ 0, 10, 20 ] }, 'a[1]');
      t.equal(res, 10, 'Data in nested array retrieved correctly.');
      t.end();
    });
    t.test('deply nested object in array', function (t) {
      var res = casper.util.atString({ a: [ { b: 0 }, 10, 20 ] }, 'a[0].b');
      t.equal(res, 0, 'Data deeply nested retrieved correctly.');
      t.end();
    });
    t.test('sets value of object', function (t) {
      var data = { a: [ { b: 0 }, 10, 20 ] };
      var res = casper.util.atString(data, 'a[0].b', 10);
      t.equal(data.a[0].b, 10, 'Data deeply nested modified correctly.');
      t.end();
    });
    t.end();
  });
  t.end();
});
