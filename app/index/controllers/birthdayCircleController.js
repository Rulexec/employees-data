angular.module('app').controller('DataBirthdayCircleController',
['$scope', 'M', '$state', 'dataService',
function($scope, M, $state, dataService) {
  var running = null;

  $scope.$parent.$watch('dataProcessing', function(dataProcessing) {
    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = dataProcessing.sets.all().bind(function(x) { return x.list(); }).bind(function(x) { return x.all() }
    ).seeBind(function(allEmployees) {
      $scope.allEmployees = allEmployees;
      //$scope.$digest();
      $scope.$emit('allEmployees');
      //console.log(discrete);
    }).run(function(error) {
      if (error) console.log(error, new Error().stack);
    }, M.nextTickY, {forceY: true}); // forceY to more y calls, to possibility to stop
  });
}]);
