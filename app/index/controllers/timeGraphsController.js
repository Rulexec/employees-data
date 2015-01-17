angular.module('app').controller('DataTimeGraphsController',
['$scope', 'M', '$state', 'dataService',
function($scope, M, $state, dataService) {
  var running = null;

  $scope.$parent.$watch('dataProcessing', function(dataProcessing) {
    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = dataProcessing.sets.all().bind(function(x) { return dataProcessing.setSizeTimeFunction(x); }
    ).bind(function(x) { return x.discrete(); }).bind(function(x) { return x.all(); }
    ).seeBind(function(discrete) {
      $scope.totalEmployeesTimeData = discrete;
      //$scope.$digest();
      $scope.$emit('totalEmployeesTimeData');
      //console.log(discrete);
    }).run(function(error) {
      if (error) console.log(error, new Error().stack);
    }, M.nextTickY, {forceY: true}); // forceY to more y calls, to possibility to stop
  });
}]);
