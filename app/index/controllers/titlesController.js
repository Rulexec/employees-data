angular.module('app').controller('TitlesController',
['$scope', 'M', '$state',
function($scope, M, $state) {

  $scope.currentOnly = true;

  var running = null;
  function update() {
    var dataProcessing = $scope.dataProcessing,
        currentOnly = $scope.currentOnly;

    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = dataProcessing.titles[currentOnly ? 'current' : 'all'](
    ).seeBind(function(allTitles) {
      allTitles.sort();
      $scope.allTitles = allTitles;
      $scope.$digest();
    }).run(function(error) {
      if (error) console.log(error, new Error().stack);
    }, M.nextTickY, {forceY: true});
  }

  $scope.$parent.$watch('dataProcessing', update);
  $scope.$watch('currentOnly', update);
}]);
