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

  this.objectFoldM = function(o, f, acc) {
    self.objectForEach(o, function(key, value, i) {
      f(acc, key, value, i);
    });

    return acc;
  };

  this.foldlFM = function(list, f, accF) {
    if (typeof accF !== 'function') accF = function() { return list[0]; };

    var acc = accF(list[0]);

    for (var i = 1; i < list.length; i++) {
      f(acc, list[i]);
    }

    return acc;
  };

  this.extremum = function(list, field, comparator) {
    field = field || (function(x) { return x; });

    var extremum = list[0],
        extremumField = field(extremum);

    for (var i = 1; i < list.length; i++) {
      var c = list[i],
          cField = field(c);

      if (comparator(extremumField, cField)) {
        extremum = c;
        extremumField = cField;
      }
    }

    return extremum;
  };

  this.min = function(list, field, comparator) {
    return self.extremum(list, field, function(a, b) { return b < a; });
  };
  this.max = function(list, field, comparator) {
    return self.extremum(list, field, function(a, b) { return b > a; });
  };

  this.mapInPlace = function(list, f) {
    for (var i = 0; i < list.length; i++) {
      list[i] = f(list[i], i);
    }
  };
}]);
