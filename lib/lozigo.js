// Requires
var net = require('net');
var fs = require('fs');
var basename = require('path').basename;
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

function buildNewEntry(entry, line) {
  var i;
  var new_entry = {};

  for(i in entry) {
    if(entry.hasOwnProperty(i)) {
      new_entry[i] = entry[i];
    }
  }

  new_entry.data = line;
  return new_entry;
}

function handleEntries(entry, middleware) {
  var i = 0;
  var lines = entry.data.split('\n');

  for(i = 0; i < lines.length; i++) {
    if(lines[i]) {
      callMiddleware(buildNewEntry(entry, lines[i]), middleware);
    }
  }
}

// Main Lozigo Object
var Lozigo = function() {
  var that = this;
  
  EventEmitter.call(this);

  this.middleware = [];
  this.server = net.createServer(function(conn) {
    var buffer = '';
    
    conn.on('data', function(data) {
      buffer += data;

      var i = 0;
      var split_buffer = buffer.split('\f');
      
      for(i = 0; i < (split_buffer.length - 1); i++) {
        try {
          handleEntries(JSON.parse(split_buffer[i]), that.middleware);
        } catch(e) {
          that.emit('error', e);
        }
      }

      buffer = split_buffer[i];
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

exports.middleware = {};

// Autoload modules
fs.readdirSync(__dirname + '/middleware').forEach(function(filename){
  if (!/\.js$/.test(filename)) {
    return;
  }

  var name = basename(filename, '.js');
  function load(){
    return require('./middleware/' + name);
  }
  exports.middleware.__defineGetter__(name, load);
  exports.__defineGetter__(name, load);
});
