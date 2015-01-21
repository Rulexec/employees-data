angular.module('app').config(
['$locationProvider', '$stateProvider', '$urlRouterProvider', 'NO_CACHE',
function($locationProvider, $stateProvider, $urlRouterProvider, NO_CACHE) {
  $urlRouterProvider.when("", "/");

  if (NO_CACHE) {
    $stateProvider.decorator('views', function (state, parent) {
      state.templateUrl += '?' + Math.random();
      return parent(state);
    });
  }

  $stateProvider.state('dataLoad', {
    params: {'ret': null },
    controller: 'DataLoadController',
    templateUrl: 'app/common/templates/data-load.html'
  }).state('index', {
    url: '/',
    controller: 'IndexController',
    templateUrl: 'app/index/templates/index.html'
  }).state('index.summary', {
    url: 'summary',
    controller: 'DataSummaryController',
    templateUrl: 'app/index/templates/summary.html'
  }).state('index.time-graphs', {
    url: 'time-graphs',
    controller: 'DataTimeGraphsController',
    templateUrl: 'app/index/templates/timeGraphs.html'
  }).state('index.birthday-circle', {
    url: 'birthday-circle',
    controller: 'DataBirthdayCircleController',
    templateUrl: 'app/index/templates/birthdayCircle.html'
  }).state('index.titles', {
    url: 'titles',
    controller: 'TitlesController',
    templateUrl: 'app/index/templates/titles.html'
  }).state('index.sizes-of-categories', {
    url: 'sizes-of-categories',
    controller: 'SetSizesController',
    templateUrl: 'app/index/templates/setSizes.html'
  });

  $stateProvider.state('404', {
    url: '*path',
    templateUrl: 'app/errors/templates/404.html'
  });

  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false
  });
}]).run(['$rootScope', '$state', 'dataService', function($rootScope, $state, dataService) {
  $rootScope.$on('$stateChangeStart', function(event, toState) {
    if (toState.name === 'index' || toState.name.slice(0, 6) === 'index.') {
      if (dataService.dataIsNotLoaded()) {
        event.preventDefault();

        $state.go('dataLoad', {ret: function() {
          $state.go(toState.name, toState.params);
        }});
      }
    }
  });
}]);
