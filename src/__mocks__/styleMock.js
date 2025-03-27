// Mock for CSS modules - simplified identity mock
module.exports = new Proxy({}, {
  get: function(_, prop) {
    return prop;
  }
}); 