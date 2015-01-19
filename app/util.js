angular.module('app').service('util', [
function() {
  var self = this;

  this.objectFields = function(o) {
    var fields = [];

    for (var name in o) if (o.hasOwnProperty(name)) fields.push(name);

    return fields;
  };

  this.objectForEach = function(o, f) {
    self.objectFields(o).forEach(function(field, i) {
      f(field, o[field], i);
    });
  };

  this.objectMap = function(o, f) {
    var result = {};

    self.objectForEach(o, function(field, value, i) {
      result[field] = f(field, value, i);
    });

    return result;
  };
}]);
