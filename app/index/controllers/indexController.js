angular.module('app').controller('IndexController',
['$scope', 'M', '$state', 'dataService',
function($scope, M, $state, dataService) {
  if ($state.current.name === 'index') $state.go('.summary');

  $scope.reload = function() {
    // $state.reload();
    // $state.reload don't work at first time
    $state.go($state.current.name, $state.current.params, {reload: true});
  }

  $scope.filters = {
    timeRange: [0, 1]
  };

  $scope.binaryFilters = [
    {name: ['gender', 'Gender'], variants: [['male', 'Male'], ['female', 'Female']]},
    {name: ['category', 'Category'], variants: [
      /*['developing', 'Developting'],
      ['testing', 'Testing'],
      ['student', 'Student'],*/
      ['other', 'Other']
    ]},
    {name: ['rank', 'Rank'], variants: [
      ['junior', 'Junior'],
      //['middle', 'Middle'],
      ['senior', 'Senior'],
      //['lead', 'Lead']
      ['other', 'Other']
    ]}
  ];

  $scope.sizes = {
    total: 0
  };

  $scope.binaryFilters.forEach(function(category) {
    var c = $scope.filters[category.name[0]] = {};
    var q = $scope.sizes[category.name[0]] = {};

    category.variants.forEach(function(variant) {
      c[variant[0]] = true;
      q[variant[0]] = {
        current: 0
      };
    });
  });

  $scope.stateIs = function(s) {
    console.log($state.is(s, null, {relative: true}));
  };

  var allDataProcessing = dataService.getDataProcessing();
  allDataProcessing.time.range().bind(function(from, to) {
    var diff = to - from;

    $scope.time = {
      calc: function(x) {
        return new Date(from.getTime() + diff * x);
      }
    };
    if (!$scope.$$phase) $scope.$digest();

    var watchFiltersFirst = true;
    var running = null;
    $scope.$watch('filters', function() {
      if (running) running.cancel().run();

      running = (watchFiltersFirst ? M.pure(null, allDataProcessing) : allDataProcessing.filter({
        time: {
          from: $scope.time.calc($scope.filters.timeRange[0]),
          to: $scope.time.calc($scope.filters.timeRange[1])
        },
        gender: $scope.filters.gender,
        category: $scope.filters.category,
        rank: $scope.filters.rank
      })).bind(function(dataProcessing) {
        $scope.dataProcessing = dataProcessing;

        return M.parallel([
          dataProcessing.sets.all().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.total = x; }),

          dataProcessing.sets.gender.male().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.gender.male.current = x; }),
          dataProcessing.sets.gender.female().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.gender.female.current = x; }),

          dataProcessing.sets.category.other().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.category.other.current = x; }),

          dataProcessing.sets.rank.junior().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.rank.junior.current = x; }),
          dataProcessing.sets.rank.senior().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.rank.senior.current = x; }),
          dataProcessing.sets.rank.other().bind(function(x) { return x.size(); }).seeBind(function(x) { $scope.sizes.rank.other.current = x; })

          // TODO: write function, that generates this from binaryFilters
        ]);
      }).run(function(error) {
        if (error) {
          console.log(error, new Error().stack);
        } else {
          $scope.$digest();
        }
      }, M.nextTickY, {forceY: true});

      if (watchFiltersFirst) watchFiltersFirst = false;
    }, true);

    return M.pure(null);
  }).run();
}]);
