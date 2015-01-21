angular.module('app').directive('relativeAreaChart', [
'util',
function(util) {
  return {
    restrict: 'E',
    scope: {
      isAbsolute: '&absolute',
      data: '&data',
      updateEvent: '@updateEvent'
    },
    link: function($scope, el, attrs, controller) {
      var updateEventName = $scope.updateEvent;

      var isAbsolute;

      if (updateEventName) {
        var unregister = $scope.$parent.$on(updateEventName, function() {
          tryUpdate();
        });

        $scope.$on('$destroy', function() {
          unregister();
        });
      }

      tryUpdate();

      function tryUpdate() {
        var data = $scope.data();
        if (data) {
          isAbsolute = $scope.isAbsolute();
          if (isAbsolute === undefined) isAbsolute = false;
          update(data);
        }
      }

      // static data
      var PHI = 1.618033988749895;

      function update(rawData) {
        // config here (and in function calcDonuts below)
        // ...

        // svg static containers/etc
        var currentSize = getContainerSize(),
            width = currentSize.width, height = currentSize.height;
        function getContainerSize() {
          return {
            width: $(el).parent().width(),
            height: $(el).parent().height()
          };
        }

        var svg = d3.select(el[0]).append('svg'
        ).attr('width', width
        ).attr('height', height
        ).style('font', '10px sans-serif');
        
        var svgDefs = svg.append('defs');
        
        var areasG = svg.append('g');

        var oldData;

        function onResize() {
          currentSize = getContainerSize();
          width = currentSize.width;
          height = currentSize.height;
          updateProcessed(oldData, isAbsolute, true);
        }
        $(window).on('resize', onResize);
        $scope.$on('$destroy', function() {
          $(window).off('resize', onResize);
        });

        var dataContext = {};

        update = function(rawData) {
          var data = processData(rawData, dataContext);
          oldData = data;
          updateProcessed(data, isAbsolute, false);
        };

        return update(rawData);
        
        function updateProcessed(data, isAbsolute, isRedraw) {
          var setsList = data.setsList;

          var scaleX = d3.time.scale(
            ).domain([data.startDate, data.endDate]
            ).range([0, width]);
          var scaleY = d3.scale.linear(
            ).domain([0, isAbsolute ? data.maxTotal : 1]
            ).range([height, 0]);

          setsList = setsList.filter(function(x) {
            return x.values.some(function(x) { return x.value > 0; });
          });

          var stacked = d3.layout.stack().offset(isAbsolute ? 'wiggle' : 'expand'
          ).values(function(d) { return d.values; }
          ).x(function(d, i){ return isAbsolute ? i : scaleX(d.date); } // FIXME: "i" is very dirty hack! FIXME!!!
          ).y(function(d) { return d.value; }
          ).out(function(d, y0, y) {
            d.stacked = {y0: y0, y: y};
          });

          stacked(setsList);

          var justArea = d3.svg.area(
            ).x(function(d) { return scaleX(d.date); }
            ).y0(function(d) { return scaleY(d.stacked.y0); }
            ).y1(function(d) { return scaleY(d.stacked.y0 + d.stacked.y); });

          var pathes = areasG.selectAll('path').data(setsList, function(x) { return x.id; });

          pathes.enter().append('path'
          ).attr('stroke', 'white'
          ).attr('stroke-width', '2'
          ).attr('fill', function(d, i) {
            if (d.context.oldI !== undefined) {
              i = d.context.oldI;
            } else {
              d.context.oldI = i;
            }
            return i % 2 === 0 ? '#ecf4f8' : '#a0c8de';
          });

          pathes.attr('d', function(d) { return justArea(d.values); });

          pathes.exit().remove();
        }

        function processData(rawData, context) {
          var nonemptyRawData = rawData.filter(function(x) { return x.length > 0; });

          var startDate = d3.min(nonemptyRawData.map(function(x) { return x[0]; }), function(x) { return x[0]; }),
              endDate = d3.max(nonemptyRawData.map(function(x) { return x[x.length - 1]; }), function(x) { return x[0]; });

          var keys = {},
              setsMap = {},
              //totalsList = [],
              pointers = [],
              pointersMap = {},
              maxTotal = 0;

          rawData.forEach(function(unused, i) {
            keys[i] = i;
            setsMap[i] = [];
            var pointer = {set: i, pos: 0};
            pointers.push(pointer);
            pointersMap[i] = pointer;

            if (context[i] === undefined) context[i] = {};
          });

          while (pointers.length > 0) {
            var closerData = pointers.filter(function(x) {
              return rawData[x.set].length > 0;
            }).map(function(x, i) {
              return {
                pointer: i,
                value: rawData[x.set][x.pos]
              };
            });

            if (closerData.length === 0) break;
            var lesserDate = util.min(closerData, function(x) { return x.value[0]; }).value[0];

            var toRemove = {};

            var total = 0;

            rawData.forEach(function(x, i) {
              var pointer = pointersMap[i];

              var p = pointer.pos,
                  v;

              if (p < x.length && x[p][0] === lesserDate) {
                v = x[p][1];

                pointer.pos++;
                if (pointer.pos >= x.length) {
                  toRemove[i] = true;
                  pointer.pos = x.length - 1;
                }
              } else {
                if (p === 0) v = 0;
                else v = x[p - 1][1];
              }

              setsMap[i].push({date: lesserDate, value: v});
              total += v;
            });

            if (total > maxTotal) maxTotal = total;
            //totalsList.push(total);

            for (var i = pointers.length - 1; i >= 0; i--) {
              if (toRemove[pointers[i].set]) pointers.splice(i, 1);
            }
          }

          /*util.objectForEach(setsMap, function(key, value) {
            value.forEach(function(x, i) {
              x.value /= totalsList[i];
            });
          });*/

          return {
            startDate: startDate,
            endDate: endDate,
            setsList: util.objectFoldM(setsMap, function(acc, key, value) {
              acc.push({id: keys[key], values: value, context: context[key]});
            }, []),
            maxTotal: maxTotal
          };
        }
      }
    }
  };
}]);
