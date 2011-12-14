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
    var to_log = entry.data;

    if(options.include_meta) {
      to_log = JSON.stringify(entry) + '\n';
    }

    if(options.file_path) {
      var write_stream = fs.createWriteStream(options.file_path, {
        flags: "a",
        encoding: "utf8",
        mode: '0666'
      });
      
      write_stream.write(to_log);
    } else {
      console.log(to_log);
    }
    
    next(entry, acc);
  }
};
