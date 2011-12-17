var fs = require('fs');

module.exports = function logger(options) {
  var defaults = {
    include_meta: true,
    file_path: false
  };
  
  if(typeof options === 'object') {
    options = options || defaults;
  } else if(typeof options === 'string') {
    options = {
      file_path: options
    };
  } else {
    options = defaults;
  }

  return function logger(entry, acc, next) {
    var to_log = entry.data + '\n';

    if(options.include_meta) {
      to_log = JSON.stringify(entry) + '\n';
    }

    if(options.log_title) {
      to_log = '[' + entry.log.name + '] ' + to_log;
    }

    if(options.file_path) {
      var write_stream = fs.createWriteStream(options.file_path, {
        flags: "a",
        encoding: "utf8",
        mode: '0666'
      });
      
      write_stream.write(to_log);
      write_stream.end();
    } else {
      console.log(to_log);
    }
    
    next(entry, acc);
  }
};
