angular.module('app').controller('DataLoadController',
['$scope', 'M', '$timeout', '$state', '$stateParams', 'dataService',
function($scope, M, $timeout, $state, $stateParams, dataService) {
  var ret = $stateParams.ret;

  dataService.loadData().then(M.tick).run(function(error) {
    if (!error) {
      ret();
    } else {
      console.log(error);
      $scope.erred = true;
      $scope.$digest();
    }
  });
}]);
