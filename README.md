# Lozigo

Collect logs from a distributed network and parse them with connect-style middleware

Simply by connecting client instances on your production machines to a server instance (normally run on it's own machine) you can
set up a single point to parse, record, and analyze all your crucial logs.

You can even hook it up with socket.io and connect/express to build a web page with dynamic information based on your logs

## Installation

Simply install using npm, it is recommended that you install it globally to obtain the lozigo command, which will spin up a client

    npm install -g lozigo
    
## Config

The configuration file is purely JSON, here is an example one which would be read by the client instance

    {
      "client_name": "Example",
      "server_port": "8181",
      "logs": [
        { "name": "First Log",
          "path": "/Users/alexangelini/Local/lozigo/examples/log1.txt" },
        { "name": "Second Log",
          "path": "/Users/alexangelini/Local/lozigo/examples/log2.txt" }
      ]
    }

## Running

To run a client instance simply

    lozigo /path/to/config.json
    
And to set up a server simply copy example.js in the examples folder

    var lozigo = require('../lib/lozigo');
    var app = lozigo.createServer();
    
    app.listen(8181, function() {
      console.log('Listening on: ' + PORT);
    });

## Middleware

Just like connect's middleware system, you tell lozigo's app to use functions with the following arguments

    function(entry, acc, next) {}
    
* "entry": Is an object which includes info about the log and the line which
  was captured
* "acc": Is an accumulator, an empty object to store information in as the 
  entry is passed through the middleware
* "next": Is a function which takes the entry and the accumulator as arguments, 
  and launches the next middleware function

To connect them to your app simply call the 'use' function

    var lozigo = require('../lib/lozigo');
    var app = lozigo.createServer();
    
    app.use(function(entry, acc, next) {
      console.log('Current entry-->', entry);
    });
    
    app.listen(8181, function() {
      console.log('Listening on: ' + PORT);
    });

## Entry

Here is an example entry
    { data: 'Test 13\n',
      date: 1323752580753,
      log: 
        { name: 'Second Log',
          path: '/Users/alexangelini/Local/lozigo/examples/log2.txt' },
      client_name: 'Example' }
