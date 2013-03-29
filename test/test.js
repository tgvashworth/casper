var capishe = require('../index'),
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
    testKey: true
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

  t.test('noop with no data', function (t) {
    setup();
    app.get('/', capishe.noop());
    t.ok(res.jsonp.calledOnce, 'jsonp was called');
    t.ok(res.jsonp.calledWith({}), 'jsonp was called correct data');
    t.end();
  });

  t.test('noop with no data', function (t) {
    setup();
    var data = { status: 'great' };
    app.get('/', capishe.noop(data));
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
        .exec(capishe.db(req, res));
    });
    t.ok(res.jsonp.calledOnce, 'jsonp was called once');
    t.end();
  });

  t.test('sends 500 with errors', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithError()
        .exec(capishe.db(req, res));
    });
    t.ok(res.jsonp.withArgs(500).calledOnce, '500 jsonp was called once');
    t.end();
  });

  t.test('sends 404 with no reults', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithNoResults()
        .exec(capishe.db(req, res));
    });
    t.ok(res.jsonp.withArgs(404, []).calledOnce, '404 jsonp was called once');
    t.end();
  });

  t.test('sends 404 with no reults', function (t) {
    setup();
    app.get('/', function (req, res) {
      FakeModel
        .findWithFalsyData()
        .exec(capishe.db(req, res));
    });
    t.ok(res.jsonp.withArgs(404, {}).calledOnce, '404 jsonp was called once');
    t.end();
  });

  t.end();

});

// ==================================
// Checks & filters
// ==================================
test('checks & filters', function (t) {

  t.test('missing parameter is caught', function (t) {
    setup();
    app.get('/',
            capishe.check.params('testParam'),
            capishe.noop());
    app.get('/:testParam',
            capishe.check.params('testParam'),
            capishe.noop());
    t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
    t.end();
  });

  t.test('present parameter is allowed', function (t) {
    setup();
    app.get('/',
            capishe.check.body('fakeKey'),
            capishe.noop());
    app.get('/',
            capishe.check.body('testKey'),
            capishe.noop());
    t.ok(res.jsonp.withArgs(400).calledOnce, '400 jsonp was called once');
    t.ok(res.jsonp.withArgs({}).calledOnce, '200 jsonp called once');
    t.end();
  });

  t.test('key is removed from body', function (t) {
    setup();
    var spy = sinon.spy(capishe.noop());
    app.get('/',
            capishe.rm('testKey'),
            function (req, res) {
              t.notOk(req.body.testKey, 'Test key removed.');
              t.end();
            });
  });

  t.end();
});


// ==================================
// Logging
// ==================================
app.get('/:testParam',
        capishe.log.the('params'),
        capishe.noop());

app.get('/:testParam',
        capishe.log.the('params.testParam'),
        capishe.noop());

// ==================================
// Utils
// ==================================
test('utilities', function (t) {
  t.test('byString', function (t) {
    t.test('nested objects', function (t) {
      var res = capishe.util.byString({ a: { b: 20 } }, 'a.b');
      t.equal(res, 20, 'Data in nested object retrieved correctly.');
      t.end();
    });
    t.test('nested array', function (t) {
      var res = capishe.util.byString({ a: [ 0, 10, 20 ] }, 'a[1]');
      t.equal(res, 10, 'Data in nested array retrieved correctly.');
      t.end();
    });
    t.end();
  });
  t.end();
});
