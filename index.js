var capishe = {};

// ==================================
// General
// ==================================

// ==================================
// Send data or and empty response
// ==================================
capishe.noop = function (data) {
  return function (req, res) {
    res.jsonp(data || {});
  };
};

// ==================================
// Database
// ==================================

// ==================================
// Generic database response handler.
// ==================================
capishe.db = function (req, res, cb) {
  return function (err, data) {
    if (err) {
      return (cb ? cb(err, data) : res.jsonp(500, { error: err.message }));
    }
    if (!data) {
      return (cb ? cb(err, data) : res.jsonp(404, {}));
    }
    if ('length' in data && data.length === 0) {
      return (cb ? cb(err) : res.jsonp(404, []));
    }
    if (cb) return cb(err, data);
    return res.jsonp(data);
  };
};

// ==================================
// Generic model creator
// ==================================
capishe.create = function (Model, data, allowBody) {
  return function (req, res) {
    var raw = new Model(data || (allowBody ? req.body : {}));
    raw.save(function (err, obj) {
      if (err) return res.send(500, err);
      res.send(obj);
    });
  };
};

// ==================================
// Checks & filters
// ==================================

capishe.check = {};

// ==================================
// Parameter checking callback
// Optional checking function. Defaults to truth checking with !
// ==================================
capishe.check.params = function (param, cb) {
  return function (req, res, next) {
    var cbPassed = true;
    if (cb) cbPassed = cb(param, req.params);
    if (!cbPassed || !req.params[param]) {
      return capishe
               .error
               .badRequest('Missing ' + param + ' URL parameter.')(req, res);
    }
    next();
  };
};

// ==================================
// Body checking.
// Like above, suports cb checking function.
// ==================================
capishe.check.body = function (key, cb) {
  return function (req, res, next) {
    var cbPassed = true;
    if (cb) cbPassed = cb(key, req.body);
    if (!cbPassed || !req.body[key]) {
      return capishe
               .error
               .badRequest('Missing ' + key + ' key from body.')(req, res);
    }
    next();
  };
};


// ==================================
// Remove key from req.body
// ==================================
capishe.rm = function (key) {
  return function (req, res, next) {
    if (req.body[key]) {
      delete req.body[key];
    }
    next();
  };
};

// ==================================
// Only allow certain keys on the body
// ==================================
capishe.allow = {};

capishe.allow.body = function (keys) {
  if (typeof keys === 'string') keys = [keys];
  return function (req, res, next) {
    // Remove all unwanted keys from the body
    Object.keys(req.body).forEach(function (key) {
      if (keys.indexOf(key) === -1) {
        delete req.body[key];
      }
    });
    next();
  };
};

// ==================================
// Errors
// ==================================

capishe.error = {};

// ==================================
// 400 Bad Request
// ==================================
capishe.error.badRequest = function (msg) {
  return function (req, res) {
    res.jsonp(400, { error: msg || 'Bad request' });
  };
};

// ==================================
// Logging
// ==================================

capishe.log = {};

// ==================================
// Log a key from the request
// ==================================
capishe.log.the = function (key) {
  return function (req, res, next) {
    console.log(key, capishe.util.atString(req, key));
    next();
  };
};

// ==================================
// Utils
// ==================================

capishe.util = {};

// ==================================
// Access object key via string
// ==================================
capishe.util.atString = function(obj, str, val) {
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

module.exports = capishe;