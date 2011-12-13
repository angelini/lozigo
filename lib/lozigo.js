// Requires
var net = require('net');
var EventEmitter = require('events').EventEmitter;

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
  
  EventEmitter.call(this);

  this.middleware = [];
  this.server = net.createServer(function(conn) {
    conn.on('data', function(data) {
      callMiddleware(JSON.parse(data), that.middleware);
    });

    conn.on('end', function() {
      that.emit('end');
    });

    conn.on('error', function(err) {
      that.emit('error', err);
    });
  });
};

Lozigo.prototype = Object.create(EventEmitter.prototype);

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

