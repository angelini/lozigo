// Constants
var PORT = 8181;

// Requires
var lozigo = require('../lib/lozigo');

// Middleware
function consoleLog(entry, acc, next) {
  console.log('entry-->', entry.data);
  acc.a = 'hello world';
  next(entry, acc);
}

function secondLog(entry, acc, next) {
  console.log('acc-->', acc);
  next(entry, acc);
}

// Main
(function main() {
  var app = lozigo.createServer();
  app.use(lozigo.keywords());
  app.use(lozigo.logger('./combine.txt'));

  app.use(consoleLog);
  app.use(secondLog);

  app.on('error', function(e) {
    console.log('error-->', e);
  });
  
  app.listen(PORT, function() {
    console.log('Listening on: ' + PORT);
  });
})();

