angular.module('app').directive('myChart', [function() {
  return {
    restrict: 'E',
    scope: {
      width: '@width',
      height: '@height',
      data: '&data',
      updateEvent: '@updateEvent'
    },
    link: function($scope, el, attrs, controller) {
      var updateEventName = $scope.updateEvent;

      if (updateEventName) {
        var unregister = $scope.$parent.$on(updateEventName, function() {
          update($scope.data());
        });

        $scope.$on('$destroy', function() {
          unregister();
        });
      }

      var width = $scope.width.trim(),
          height = $scope.height.trim();

      percents: {
        if (width[width.length - 1] !== '%') {
          width = parseInt(width);
          if (isNaN(width) || width < 0 || !isFinite(width)) {
            console.error('myChart width is bad number: ' + $scope.width + ', assumed 100%');
            width = '100%';
          } else {
            // is pixels
            break percents;
          }
        }

        // is percents
        var percents = parseFloat(width.slice(0, -1));
        if (isNaN(percents) || percents < 0 || !isFinite(percents)) {
          console.error('myChar width is bad number: ' + $scope.width + ', assumed 100%');
          percents = 1;
        } else {
          percents /= 100;
        }

        width = $(el).offsetParent().width() * percents;
      };

      var height = parseInt($scope.height.trim());
      if (isNaN(height) || height < 0 || !isFinite(height)) {
        console.error('myChart height is bad number: ' + $scope.height + ', assumed 500px');
        height = 500;
      }

      function update(data) {
        $(el).empty();

        var minDate = d3.min(data, function(x) { return x[0]; }),
            maxDate = d3.max(data, function(x) { return x[0]; }),
            dateDiff = maxDate - minDate,
            maxEmployees = d3.max(data, function(x) { return x[1]; });

        var outerChartMargin = {top: 0, right: 20, bottom: 40, left: 40},
            innerChartMargin = {top: 0, right: 20, bottom: 20, left: 20},
            innerChartSize = {
              width: width - (outerChartMargin.left + outerChartMargin.right) - (innerChartMargin.left + innerChartMargin.right),
              height: height - (outerChartMargin.top + outerChartMargin.bottom) - (innerChartMargin.top + innerChartMargin.bottom)
            };

        var svg = d3.select(el[0]).append('svg'
        ).attr('width', width
        ).attr('height', height 
        ).style('font', '10px sans-serif'
        ).append('g'
          ).attr('transform', 'translate(' + outerChartMargin.left + ',' + outerChartMargin.top + ')');

        var linesG = svg.append('g'
        ).attr('transform',
          'translate(' + innerChartMargin.left + ',' + innerChartMargin.top + ')');

        var lineChartX = d3.time.scale(
        ).domain([minDate, maxDate]
        ).range([0, innerChartSize.width]);

        var lineChartY = d3.scale.linear(
        ).domain([0, maxEmployees]
        ).range([innerChartSize.height, 0]);

        var xAxis = d3.svg.axis()
            .scale(lineChartX)
            .orient("bottom");

        var yAxis = d3.svg.axis(
        ).scale(lineChartY
        ).orient('left');

        var yAxisG = svg.append('g'
        ).attr('transform', 'translate(' + 0 + ',' + innerChartMargin.top + ')'
        ).call(yAxis);
        yAxisG.selectAll('line').attr('stroke', 'black');
        yAxisG.selectAll('path').attr('fill', 'none').attr('stroke', 'black').attr('shape-rendering', 'crispEdges');

        var xAxisG = svg.append('g'
        ).attr('transform', 'translate(' + innerChartMargin.left + ',' + (innerChartMargin.top + innerChartSize.height + innerChartMargin.bottom) + ')'
        ).call(xAxis);
        xAxisG.selectAll('line').attr('stroke', 'black');
        xAxisG.selectAll('path').attr('fill', 'none').attr('stroke', 'black').attr('shape-rendering', 'crispEdges');

        var chartLine = d3.svg.line(
        //).interpolate('basis'
        ).x(function(d) { return lineChartX(d[0]); }
        ).y(function(d) { return lineChartY(d[1]); });

        addLine(linesG, data);

        function addLine(g, data) {
          g.datum(data).append('path'
          ).attr('d', function(d) { return chartLine(d); }
          ).attr('stroke', 'black').attr('fill', 'none');
        }
      }
    }
  };
}]);
