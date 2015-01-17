angular.module('app').controller('TitlesController',
['$scope', 'M', '$state',
function($scope, M, $state) {
  var running = null;

  $scope.$parent.$watch('dataProcessing', function(dataProcessing) {
    if (!dataProcessing) return;
    if (running) running.cancel().run();

    running = dataProcessing.titles.all(
    ).seeBind(function(allTitles) {
      allTitles.sort();
      $scope.allTitles = allTitles;
      $scope.$digest();
    }).run(function(error) {
      if (error) console.log(error, new Error().stack);
    }, M.nextTickY, {forceY: true});
  });
}]);
