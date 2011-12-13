// Requires
var net = require('net');

// Utility Functions
function callMiddleware(entry, middleware) {
  var index = 0;

  function next(entry, acc) {
    var layer = middleware[index++];
    if (!layer) {
      return;
    }

    var accumulator = acc || {};
    layer(entry, accumulator, next);
  }

  next(entry);
}

// Main Lozigo Object
var Lozigo = function() {
  var that = this;

  this.middleware = [];
  this.server = net.createServer(function(conn) {
    conn.on('data', function(data) {
      callMiddleware(data.toString(), that.middleware);
    });
  });
};

Lozigo.prototype.use = function(fn) {
  this.middleware.push(fn);
};

Lozigo.prototype.listen = function(port) {
  var args = Array.prototype.slice.call(arguments);
  var callback = null;

  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  this.server.listen(port, callback);
};

// Exports
exports.createServer = function() {
  return new Lozigo();
};

