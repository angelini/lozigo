module.exports = function keywords(options) {
  options = options || {};
  
  return function keywords(entry, acc, next) {
    var i = 0;
    var keys = entry.data.replace(/[^A-Za-z0-9]/g, ' ').split(' ');
  
    for(i = 0; i < keys.length; i++) {
      if(!keys[i]) {
        keys.splice(i, 1);
      }
    }

    acc.keywords = keys;
    next(entry, acc);
  }
};
