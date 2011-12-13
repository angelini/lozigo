#!/usr/bin/env node

// Constants
var DEV = 2;
var PROD = 1;
var EXCEPTION = 0;
var ENV = DEV;
var DEFAULT_CONFIG = '../examples/config.json';

// Requires
var fs = require('fs');
var net = require('net');
var spawn = require('child_process').spawn;

// Utility Functions
function verifyConfig(config) {
  var i = 0;
  var required = ['logs', 'client_name', 'server_port'];
  var optional = {
    'server_host': '127.0.0.1'
  };

  for(i = 0; i < required.lenght; i++) {
    if(!config[required[i]]) {
      throw 'Config missing required: ' + required[i];
    }
  }

  for(i in optional) {
    if(optional.hasOwnProperty(i)) {
      if(!config[i]) {
        config[i] = optional[i];
      }
    }
  }

  return config;
}

function readConfig(config) {
  var config_string = fs.readFileSync(config);

  try {
    return verifyConfig(JSON.parse(config_string));
  } catch(e) {
    throw 'Unable to parse config: ' + e.message;
  }
}

function pipeTail(client, path) {
  var tail = spawn('tail', ['-Fn', 0, path]);
  tail.stdout.pipe(client);
}

function log(message, level) {
  if(ENV >= level) {
    console.log('Log level: ' + level + ' -->', message);
  }
}

// Main
(function main() {
  var i = 0;
  var config_path = DEFAULT_CONFIG;

  if(process.argv.length >= 3) {
    config_path = process.argv[2];
  }

  var config = readConfig(config_path);

  var client = net.connect(config.server_port, config.server_host, function() {
    log('Client connected', DEV);
  });

  client.on('end', function() {
    log('Client disconnected', DEV);
  });

  for(i = 0; i < config.logs.length; i++) {
    pipeTail(client, config.logs[i].path);
  }
})();
