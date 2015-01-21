angular.module('app').controller('SetSizesController',
['$scope', 'M', '$state', 'util',
function($scope, M, $state, util) {
  $scope.isAbsolute = false;

  var groups = [
    {name: 'maleAndFemaleSizes', sets: function(dp) { return [dp.sets.gender.female(), dp.sets.gender.male()]; }},
    {name: 'ranksSizes', sets: function(dp) { return allSets(dp.sets.rank); }}
  ];
  groups.forEach(function(x) { $scope[x.name] = null; });

  var running = null;
  function update() {
    var dataProcessing = $scope.dataProcessing;

    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = M.parallel(groups.map(function(x) { return group(x.name, x.sets(dataProcessing)); }), {drop: true}
    ).run(function(error) {
      if (error) console.log(error.stack ? error.stack : error, '\n', new Error().stack);
    }, M.nextTickY, {forceY: true});

    function group(name, sets) {
      return M.parallel(sets, {single: true}).bind(function(sets) {
        return M.parallel(sets.map(function(x) {
          return dataProcessing.setSizeTimeFunction(x
          ).bind(function(x) { return x.discrete(); }
          ).bind(function(x) { return x.all(); });
        }), {single: true});
      }).bind(function(sizes) {
        $scope[name] = sizes;
        $scope.$emit(name);
        return M.pure(null);
      });
    }
  }

  $scope.$parent.$watch('dataProcessing', update);
  $scope.$watch('isAbsolute', function() {
    groups.forEach(function(x) {
      $scope.$emit(x.name);
    });
  });

  function allSets(o) {
    return util.objectFoldM(o, function(acc, key, value) {
      acc.push(value());
    }, []);
  }
}]);
