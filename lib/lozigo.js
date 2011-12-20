// Requires
var net = require('net');
var fs = require('fs');
var socket_io = require('socket.io');
var basename = require('path').basename;
var EventEmitter = require('events').EventEmitter;

// Utility Functions
function callMiddleware(entry, middleware, callback) {
  var index = 0;

  function next(entry, acc) {
    var layer = middleware[index++];
    if (!layer) {
      return callback(entry, acc);
    }

    var accumulator = acc || {};
    layer(entry, accumulator, next);
  }

  next(entry);
}

function buildNewEntry(info, line) {
  var i;
  var entry = {};

  for(i in info) {
    if(info.hasOwnProperty(i)) {
      entry[i] = info[i];
    }
  }

  entry.data = line;
  return entry;
}

function handleEntries(buffer, info, middleware, callback) {
  var i = 0;
  var lines = buffer.split('\n');

  for(i = 0; i < lines.length; i++) {
    if(lines[i]) {
      callMiddleware(buildNewEntry(info, lines[i]), middleware, callback);
    }
  }
}

function emitComplete(entry, acc) {
  this.emit('complete', entry, acc);
}

// Main Lozigo Object
var Lozigo = function() {
  var that = this;
  var boundEmitComplete = emitComplete.bind(this);
  
  EventEmitter.call(this);

  this.middleware = [];
  this.server = net.createServer(function(conn) {
    var buffer = '';
    var info = null;

    conn.on('data', function(data) {
      buffer += data;

      if(!info) {
        if(buffer.indexOf('\f') !== -1) {
          var split = buffer.split('\f');
          
          try {
            info = JSON.parse(split[0]);
            buffer = split[1];
          } catch(e) {
            that.emit('error', e);
          }
        }
      }

      if(buffer && info) {
        handleEntries(buffer, info, that.middleware, boundEmitComplete);
        buffer = '';
      }
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

Lozigo.prototype.connect = function(app, search) {
  var that = this;
  var io = socket_io.listen(app);

  io.configure(function(){
    io.set('log level', 0);
  });

  io.sockets.on('connection', function(socket) {
    socket.emitWeb = function(entry, acc) {
      if(acc.web) {
        socket.emit('lozigo', acc.web);
      }
    };

    that.on('complete', socket.emitWeb);

    socket.on('search', function(query, callback) {
      var spawn = require('child_process').spawn;
      var grep = spawn('grep', [query, search]);
      var buffer = '';

      grep.stdout.on('data', function(data) {
        buffer += data;
      });

      grep.on('exit', function() {
        callback(buffer);
      });
    });
    
    socket.on('disconnect', function() {
      that.removeListener('complete', socket.emitWeb);
    });
  });
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
