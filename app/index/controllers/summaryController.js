angular.module('app').controller('DataSummaryController',
['$scope', 'M', '$state', 'dataService',
function($scope, M, $state, dataService) {
  $scope.summary = {
    totalEmployees: 0
  };

  var running = null;
  $scope.$watch('$parent.dataProcessing', function(dataProcessing) {
    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = dataProcessing.sets.all().bind(function(x) { return x.size(); }).bind(function(totalEmployees) {
      $scope.summary.totalEmployees = totalEmployees;
      $scope.$digest();
      return M.pure(null);
    }).run(function(error) {
      if (error) console.log(error, new Error().stack);
    }, M.nextTickY, {forceY: true}); // forceY to more y calls, to possibility to stop
  }); 
}]);
