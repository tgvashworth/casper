var casper = {};

// ==================================
// General
// ==================================

// ==================================
// Send data or and empty response
// ==================================
casper.send = casper.noop = function (data) {
  return function (req, res) {
    res.jsonp(data || {});
  };
};

// ==================================
// Generic response handler.
// Use in a database callback to automatically serve the retrieved data, or a
// 404 if none is found. You can also supply a callback to be called when no
// error was generated and some data was returned, and an errorback for any
// other situation.
//
// Example:
//
//   User.find({}).exec(casper.respond(req, res))
//
//   User.find({}).exec(casper.respond(req, res, function (err, data) {
//     // err will always be falsey
//     . . .
//   }));
//
//   User.find({}).exec(casper.respond(req, res, function (err, data) {
//     . . .
//   }, function (err) {
//     // This will called if there was an error or no data.
//     . . .
//   }));
//
//  Returns a function that accepts two parameters. error  dat
// ==================================
casper.respond = casper.db = function (req, res, cb, errb) {
  return function (err, data) {
    if (err) {
      return (errb ? errb(err) : res.jsonp(500, { error: err.message }));
    }
    if (!data) {
      return (errb ? errb(err, data) : res.jsonp(404, { error: 'Not found.' }));
    }
    if (cb) return cb(err, data);
    return res.jsonp(data);
  };
};

// ==================================
// Database
// ==================================

// ==================================
// Generic model creator
// Supply a model object (a constructor) that accepts an object for its data.
// ==================================
casper.create = function (Model, data, allowBody, cb) {
  return function (req, res) {
    var raw = new Model(data || (allowBody ? req.body : {}));
    raw.save(cb || function (err, obj) {
      if (err) return res.jsonp(500, err);
      res.jsonp(obj);
    });
  };
};

// ==================================
// Checks & filters
// ==================================

casper.check = function (property, keys, cb) {
  if (typeof keys === 'string') keys = [keys];
  return function (req, res, next) {
    if (!req[property]) return next();
    var missing = [];
    keys.forEach(function (key) {
      var ok = true;
      if (cb) ok = cb(req[property][key], req[property]);
      if(!ok || typeof req[property][key] === "undefined") {
        missing.push(key);
      }
    });
    if (!missing.length) return next();
    casper.error
     .badRequest('Missing ' + missing.join(', ') + ' from ' + property + '.')(req, res);
  };
};

// ==================================
// Parameter checking callback
// Optional checking function. Defaults to truth checking with !
// ==================================
casper.check.params = casper.check.bind(null, 'params');

// ==================================
// Body checking.
// Like above, suports cb checking function.
// ==================================
casper.check.body = casper.check.bind(null, 'body');

// ==================================
// Query checking.
// Like above, suports cb checking function.
// ==================================
casper.check.query = casper.check.bind(null, 'query');

// ==================================
// Remove
// ==================================

casper.rm = function (property, keys) {
  if (typeof keys === 'string') keys = [keys];
  return function (req, res, next) {
    if (!req[property]) return next();
    keys.forEach(function (key) {
      if (req[property][key]) {
        delete req[property][key];
      }
    });
    next();
  };
};;

// ==================================
// Remove key from req.body
// ==================================
casper.rm.body = casper.rm.bind(null, 'body');

// ==================================
// Allow
// ==================================

casper.allow = function (property, keys) {
  if (typeof keys === 'string') keys = [keys];
  return function (req, res, next) {
    if (!req[property]) return next();
    // Remove all unwanted keys from the body
    Object.keys(req[property]).forEach(function (key) {
      if (keys.indexOf(key) === -1) {
        delete req[property][key];
      }
    });
    next();
  };
};

// ==================================
// Only allow certain keys on the body
// ==================================

casper.allow.body = casper.allow.bind(null, 'body');

// ==================================
// Errors
// ==================================

casper.error = function (code, msg) {
  return function (req, res) {
    res.jsonp(code, { error: msg });
  };
};

// ==================================
// 400 Bad Request
// ==================================
casper.error.badRequest = casper.error.bind(null, 400);

// ==================================
// Logging
// ==================================

// ==================================
// Log a key from the request
// ==================================
casper.log = function (key) {
  return function (req, res, next) {
    console.log(key, casper.util.atString(req, key));
    next();
  };
};

casper.log.the = casper.log;

// ==================================
// Utils
// ==================================

casper.util = {};

// ==================================
// Get or set object key via string.
//
// Examples:
//
//   var user = { name: { first: 'Tom' } },
//       firstname;
//   firstname = casper.util.at(user, 'name.first'); // Tom
//   casper.util.at(user, 'name.first', 'Joe')
//   firstname = casper.util.at(user, 'name.first'); // Joe
//
// Returns the original object.
// ==================================
casper.util.at = casper.util.atString = function(obj, str, val) {
  var args = [].slice.call(arguments);
  str = str.replace(/\[(\w+)\]/g, '.$1')
           .replace(/^\./, '');
  var arr = str.split('.'),
      parent, key;
  while (arr.length) {
    key = arr.shift();
    if (key in obj) {
      parent = obj;
      obj = obj[key];
    } else {
      return;
    }
  }
  if (args.length > 2) {
    parent[key] = val;
  }
  return obj;
};

module.exports = casper;