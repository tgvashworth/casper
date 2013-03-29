var capishe = require('./index'),
    _ = require('underscore');

// ==================================
// Fixtures
// ==================================

var app = {};
app.get = app.post = function (path) {

  var req = {};
  req.params = [];
  req.body = {
    testKey: true
  };

  var res = {};
  res.send = res.json = res.jsonp = function () {
    console.log.apply(console, [].slice.call(arguments));
  };

  req.params = (path.match(/[a-zA-Z]+/g) || []).reduce(function (memo, param) {
    memo[param] = true;
    return memo;
  }, {});

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
app.get('/', capishe.noop());
app.get('/', capishe.noop({ status: 'great' }));


// ==================================
// Database
// ==================================
app.get('/', function (req, res) {
  FakeModel
    .find()
    .exec(capishe.db(req, res));
});

app.post('/', function (req, res) {
  FakeModel
    .find()
    .exec(capishe.db(req, res));
});

app.post('/', function (req, res) {
  FakeModel
    .findWithError()
    .exec(capishe.db(req, res));
});

app.post('/', function (req, res) {
  FakeModel
    .findWithNoResults()
    .exec(capishe.db(req, res));
});

app.post('/', function (req, res) {
  FakeModel
    .findWithFalsyData()
    .exec(capishe.db(req, res));
});

// ==================================
// Checks & filters
// ==================================
app.get('/',
        capishe.check.params('testParam'),
        capishe.noop());
app.get('/:testParam',
        capishe.check.params('testParam'),
        capishe.noop());

app.get('/',
        capishe.check.body('fakeKey'),
        capishe.noop());
app.get('/',
        capishe.check.body('testKey'),
        capishe.noop());

app.get('/',
        capishe.rm('testKey'),
        capishe.noop());
