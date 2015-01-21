angular.module('app').directive('birthdayCircle', [function() {
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
          var data = $scope.data();
          if (data) update(data);
        });

        $scope.$on('$destroy', function() {
          unregister();
        });
      }

      var data = $scope.data();
      if (data) update(data);

      // static data
      var PHI = 1.618033988749895;
      var astrologicalSignsTimeRanges = [
        {from: {day: 21, month: 3}, to: {day: 19, month: 4}},
        {from: {day: 20, month: 4}, to: {day: 20, month: 5}},
        {from: {day: 21, month: 5}, to: {day: 20, month: 6}},
        {from: {day: 21, month: 6}, to: {day: 22, month: 7}},
        {from: {day: 23, month: 7}, to: {day: 22, month: 8}},
        {from: {day: 23, month: 8}, to: {day: 22, month: 9}},
        {from: {day: 23, month: 9}, to: {day: 22, month: 10}},
        {from: {day: 23, month: 10}, to: {day: 21, month: 11}},
        {from: {day: 22, month: 11}, to: {day: 21, month: 12}},
        {from: {day: 22, month: 12}, to: {day: 19, month: 1}},
        {from: {day: 20, month: 1}, to: {day: 18, month: 2}},
        {from: {day: 19, month: 2}, to: {day: 20, month: 3}}
      ];
      var astrologicalSignsUnicode = '♈♉♊♋♌♍♎♏♐♑♒♓';
      var astrologicalSignsNames = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(function(x) { return x.toLowerCase(); });
      var astrologicalSignsColors = ['#d34402', '#3ca022', '#ba3b70', '#219fd2'];
      var firstDayOfAstrologySigns = astrologicalSignsTimeRanges[0].from;
      firstDayOfAstrologySigns = moment({year: 2004, month: firstDayOfAstrologySigns.month - 1, day: firstDayOfAstrologySigns.day}).dayOfYear();
      var astrologicalSignsTimeRangesDays = astrologicalSignsTimeRanges.map(function(x) {
        var fromDay = moment({year: 2004, month: x.from.month - 1, day: x.from.day}).dayOfYear(),
            toDay = moment({year: 2004, month: x.to.month - 1, day: x.to.day}).dayOfYear();
        
        return [fromDay, toDay];
      });

      var monthsStartDays = [1, 32, 61, 92, 122, 153, 183, 214, 245, 275, 306, 336, 367],
          monthsStartAndEnd = monthsStartDays.slice(0, -1).map(function(from, i) { return {from: from, to: monthsStartDays[i + 1]}; }),
          monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      function update(data) {
        // config here (and in function calcDonuts below)
        var showTransitionStartTime = new Date().getTime(),
            showTransitionDuration = 1000,

            startOfYearAngle = (-Math.PI / 2) - ((astrologicalSignsTimeRangesDays[0][0] - 1) / 366) * 2 * Math.PI,
            yearDaysClockwise = true,
            yearDaysDirection = yearDaysClockwise ? 1 : -1;

            startShowStartAngle = -Math.PI / 2,
            startShowClockwise = true,

            // from event horizont, that defined in calcDonuts,
            // animation of appearance will be synced with showTransition
            personCircleAppearanceDuration = 500,
            appearanceEase = d3.ease('elastic'),

            disappearanceEase = d3.ease('back', 1.5),
            disappearanceDuration = 500;

        // gets day from 1 to 366, returns angle, where 1 -> startOfYearAngle
        function dayToAngle(day, centered) {
          //return ((((day - 1 - 91.5 - firstDayOfAstrologySigns) - (centered ? 0.5 : 0)) / 366) * (2 * Math.PI)) % (Math.PI * 2);
          day--;
          if (centered) day -= 0.5;
          day %= 366;
          if (!yearDaysClockwise) {
            day = 365 - day;
          }
          day /= 366;
          return (startOfYearAngle + day * 2 * Math.PI) % (Math.PI * 2);
        }

        // svg static containers/etc
        var width = 1000, height = 1000,
            fullRadius = Math.min(width, height) / 2;
        var svg = d3.select(el[0]).append('svg'
        ).attr('width', '100%'
        ).attr('height', '100%'
        ).attr('preserveAspectRatio', 'xMidYMid meet'
        ).attr('viewBox', '0 0 ' + width + ' ' + height
        ).style('font', '10px sans-serif');
        
        var svgDefs = svg.append('defs');

        var centerG = svg.append('g'
        ).attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        var tw = scalePolygonPointsMorphism(circularPolygonPoints(startShowStartAngle, startShowClockwise), 0, 0, fullRadius, fullRadius);

        var mask = svgDefs.append('mask').attr('id', 'segmentsShowMask');
        mask.append('polygon'
        ).attr('fill', 'white'
        ).transition().ease(d3.ease('linear')).duration(showTransitionDuration
        ).attrTween('points', function() { return tw; });

        //centerG.append('polygon').attr('fill', 'none').attr('stroke', 'black').transition().ease(d3.ease('linear')).duration(showTransitionDuration
        //).attrTween('points', function() { return tw; });

        var dataContext = {map: {}};

        update = function(data) {
          var data = processData(data, dataContext),
              donuts = calcDonuts(data),
              centerRadius = donuts.centerWidth * fullRadius;
          donuts = donuts.donuts;
          
          var maxBirthdaysInSameDay = data.maxBirthdaysInSameDay,
              groupedByDay = data.groupedByDay,
              peopleList = data.peopleList;

          // data preprocessing
          (function() {
            var r = centerRadius;

            donuts.forEach(function(x) {
              x.width *= fullRadius;
              x.innerRadius = r;
              x.outerRadius = r = r + x.width;
            });

            donuts.sort(function(a, b) { return a.z - b.z; });
          })();

          peopleList.forEach(function(x) {
            x.angle = dayToAngle(x.day, true);
          });

          groupedByDay.forEach(function(group) {
            group.people.forEach(function(x, i) {
              x.idInDay = i;
            });
          });

          var donutsG = centerG.selectAll('.donut').data(donuts, function(d) { return d.name; });

          // creating donuts
          donutsG.enter().append('g').each(function(d) {
            var g = d3.select(this),
                donutD = d;

            if (d.name !== 'people') {
              // months or zodiac
              g.attr('mask', 'url(#segmentsShowMask)');
            }

            g.classed({donut: true});

            ({ months: function() {
              g.selectAll().data(monthsStartAndEnd).enter(
              ).append('g').each(function(d, i) {
                var h = (((i % 2 === 0 ? (i + 6) % 12 : i)) / 12) * 360;

                var angles = maybeReverse([dayToAngle(d.from), dayToAngle(d.to)], !yearDaysClockwise);

                d3.select(this).call(segmentPolar(0, 0, donutD.innerRadius, donutD.outerRadius, angles[0], angles[1])
                ).attr('fill', 'hsl(' + h + ', 98%, 70%)');
              })
            }, zodiac: function() {
              g.selectAll().data(astrologicalSignsTimeRangesDays).enter(
              ).append('g').each(function(range, i) {
                var fromDay = range[0],
                    toDay = range[1];

                var angles = maybeReverse([dayToAngle(fromDay, false), dayToAngle(toDay + 1, false)], !yearDaysClockwise);

                var fromAngle = angles[0], toAngle = angles[1];

                var diff = angleDiff(fromAngle, toAngle),
                    middleAngle = fromAngle + diff / 2;

                var g = d3.select(this);

                var segmentG = g.append('g'
                ).attr('transform', 'rotate(' + (middleAngle / (Math.PI * 2) * 360) + ')'
                );

                var gradientId = 'zodiacGradient' + i;

                // segment
                segmentPolar(0, 0, donutD.innerRadius, donutD.outerRadius, -diff / 2, diff / 2)(segmentG
                ).attr('fill', 'url(#' + gradientId + ')'
                );

                // letters & arcs
                var signTitleSize;
                if (donutD.signTitle) {
                  signTitleSize = donutD.signTitle.width * donutD.width;
                } else {
                  signTitleSize = 0;
                }

                var letterDistance = donutD.innerRadius + (donutD.width - signTitleSize) / 2;// - 25;
                g.append('g'
                ).attr('transform',
                  'translate(' + (Math.cos(middleAngle) * letterDistance) + ',' + (Math.sin(middleAngle) * letterDistance) +') ' +
                  'rotate(' + ((middleAngle) / (Math.PI * 2) * 360 + 90) + ')'
                ).append('text'
                  ).attr('x', 0).attr('y', 0
                  ).text(astrologicalSignsUnicode[i]
                  ).attr('font-family', 'serif'
                  ).attr('text-anchor', 'middle'
                  ).attr('alignment-baseline', 'central'
                  ).attr('fill', 'white'
                  ).attr('font-size', (donutD.width - signTitleSize) * 0.75);
                
                if (donutD.signTitle) {
                  var offsetMultiplier = donutD.signTitle.arcOffset;
                  var fromAngleWithOffset = fromAngle + diff * offsetMultiplier,
                      toAngleWithOffset = toAngle - diff * offsetMultiplier;

                  var arcDistance = donutD.outerRadius - signTitleSize;

                  arcPolar(arcDistance, fromAngleWithOffset, toAngleWithOffset)(g
                  ).attr('opacity', 0.5
                  ).attr('stroke', 'white').attr('stroke-width', 4).attr('fill', 'none');

                  var guideId = 'arcAstrologicalGuide' + i;
                  arcPolar(arcDistance + (signTitleSize / 2), fromAngleWithOffset, toAngleWithOffset)(g
                  ).attr('id', guideId
                  ).attr('stroke', 'none').attr('fill', 'none');

                  g.append('text'
                  ).attr('font-family', 'serif'
                  ).attr('font-size', (signTitleSize * 0.6)
                  ).attr('text-anchor', 'middle'
                  ).attr('fill', 'white'
                    ).append('textPath'
                    ).attr('alignment-baseline', 'middle'
                    ).attr('startOffset', '50%'
                    ).attr('xlink:href', '#' + guideId).text(astrologicalSignsNames[i]);
                }

                // gradient of segment
                var fillColor = astrologicalSignsColors[i % 4];

                var distanceBbOfSegment = (Math.cos(diff / 2) * donutD.innerRadius),
                    segmentWidth = donutD.width,
                    gradientOffset = -distanceBbOfSegment / segmentWidth,
                    gradientRadius = donutD.outerRadius / segmentWidth;

                var radialGradient = svgDefs.append('radialGradient').attr('id', gradientId
                ).attr('r', gradientRadius).attr('cx', gradientOffset).attr('cy', '50%');
                radialGradient.append('stop').attr('offset', '0%').attr('stop-color', 'white');
                radialGradient.append('stop').attr('offset', '100%').attr('stop-color', fillColor);
              });
            }, people: function() {
              g.attr('id', 'peopleG');
              /*d3.selectAll([
                segmentPolar(0, 0, d.innerRadius, d.outerRadius, 0, Math.PI)(g).node(),
                segmentPolar(0, 0, d.innerRadius, d.outerRadius, Math.PI, 2 * Math.PI)(g).node()
              ]).attr('fill', '#fbfbfb');*/
            }})[d.name]();
          });

          // data
          donutsG.each(function(d) {
            var g = d3.select(this),
                donutD = d;

            ({ months: function() {
            }, zodiac: function() {
            }, people: function() {
              var personCircleRadius = donutD.width / maxBirthdaysInSameDay / 2,
                  distanceToFirstPerson = donutD.innerRadius + personCircleRadius;
              personCircleRadius = Math.min(personCircleRadius, Math.sin((2 * Math.PI) / 366 / 2) * distanceToFirstPerson);
              var direction = donutD.placeAtInner ? 1 : -1;
              distanceToFirstPerson = (donutD.placeAtInner ? donutD.innerRadius : donutD.outerRadius) + direction * personCircleRadius;

              var eventHorizontDistance = donutD.eventHorizont * fullRadius;

              var personG = centerG.select('#peopleG').selectAll('.person').data(peopleList, function(x) { return x.original.id; });

              // creation
              personG.enter().append('g').classed({person: true}
              ).each(function(d){d3.select(this).classed('_id_' + d.day, true);}
              ).append('circle'
                ).attr('opacity', 0
                ).each(function(d) {
                  var p = toCartesian(d.angle, eventHorizontDistance);
                  d3.select(this).attr('cx', p.x).attr('cy', p.y);
                }).attr('r', personCircleRadius
                ).attr('fill', function(d) {
                  if (d.original.gender === true) {
                    return '#5677fc';
                  } else if (d.original.gender === false) {
                    return '#e040fb';
                  } else {
                    return 'gray';
                  }
                  return 'gray';
                }
              );

              // moving
              personG.classed('exiting', false);

              var now = new Date().getTime(),
                  timeFromStartShow = now - showTransitionStartTime,
                  startShowTransitionFinished = timeFromStartShow >= showTransitionDuration,
                  startShowPercentsPassed;
              if (startShowTransitionFinished) {
                startShowPercentsPassed = 1;
              } else {
                startShowPercentsPassed = timeFromStartShow / showTransitionDuration;
              }
              personG.each(function(d) {
                var idInDay = d.idInDay;

                var angle = d.angle;
                var distance = distanceToFirstPerson + direction * idInDay * (2 * personCircleRadius);

                var p = toCartesian(angle, distance);

                var appearanceDelay;
                if (startShowTransitionFinished) {
                  appearanceDelay = 0;
                } else {
                  appearanceDelay = angleNormalize(angle + (2 * Math.PI - startShowStartAngle)) - startShowPercentsPassed;
                  if (appearanceDelay < 0) appearanceDelay = 0;
                  if (!startShowClockwise) appearanceDelay = 1 - appearanceDelay;
                  appearanceDelay *= showTransitionDuration;
                }

                var transition = d3.select(this).select('circle').transition(
                  ).ease(appearanceEase
                  ).delay(appearanceDelay
                  ).duration(personCircleAppearanceDuration
                  ).attr('opacity', 1
                  ).attr('cx', p.x).attr('cy', p.y);
              });

              // removing
              personG.exit().filter(':not(.exiting)').each(function(d) {
                var g = d3.select(this);

                g.classed('exiting', true);

                var p = toCartesian(d.angle, eventHorizontDistance);

                g.select('circle'
                ).transition().ease(disappearanceEase).duration(disappearanceDuration).attr('opacity', 0
                ).attr('cx', p.x).attr('cy', p.y
                ).each('end', function() {
                  g.remove();
                });
              });
            }})[d.name]();
          });
        };

        return update(data);

        function processData(rawData, context) {
          var birthdaysMap = {},
              birthdaysList = [],
              peopleList = [];
          var employeesCount = 0, maxBirthdaysInSameDay = 0;

          rawData.filter(function(x) { return x.birthday !== null; }).forEach(function(x) {
            var d = dateToDayOfYear(x.birthday);

            context.map[x.id] = context.map[x.id] || {};

            // 60 is a 1 march of non-leap year, we are saying, that 60 is a 29 febrary, always
            if (!isLeapYear(x.birthday.getFullYear()) && d >= 60) d++;

            var person = {
              day: d,
              context: context.map[x.id],
              original: x
            };

            var newLength = (birthdaysMap[d] || (birthdaysList.push(d), birthdaysMap[d] = [])).push(person);
            if (newLength > maxBirthdaysInSameDay) maxBirthdaysInSameDay = newLength;

            peopleList.push(person);

            employeesCount++;
          });

          var groupedByDay = birthdaysList.map(function(d) {
            return {day: d, people: birthdaysMap[d]};
          });

          return {
            count: employeesCount,
            maxBirthdaysInSameDay: maxBirthdaysInSameDay,
            birthdaysList: birthdaysList,
            birthdaysMap: birthdaysMap,
            groupedByDay: groupedByDay,
            peopleList: peopleList
          };

          function isLeapYear(year) {
            if (year % 4 === 0) {
              if (year % 400 === 0) return true;
              if (year % 100 === 0) return false;
              
              return true;
            }

            return false;
          }
          function dateToDayOfYear(date) {
            var monthes = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; 

            return monthes[date.getMonth()] + date.getDate();
          };
        }

        function calcDonuts(data) {
          var donuts = [
            {name: 'months', width: 0.1, z: 2},
            {name: 'zodiac', width: 3, signTitle: {width: 1 - (1 / PHI), arcOffset: 0.1}, z: 1},
            {name: 'people', width: 0.5, placeAtInner: true, eventHorizont: 0.1 + 3 / 2, z: 0} // TODO: magic calculation of width value
          ];
          var totalWidth = d3.sum(donuts, function(x) { return x.width; });

          var centerRadius = (1 / PHI),
              widthMultiplier = (1 - centerRadius) / totalWidth;

          donuts.forEach(function(x) {
            x.width *= widthMultiplier;
          });
          donuts[2].eventHorizont *= widthMultiplier;
          donuts[2].eventHorizont += centerRadius;

          var o = {
            centerWidth: (1 / PHI),
            donuts: donuts
          };

          return o;
        }

        function circularPolygonPoints(startAngle, clockwise) {
          startAngle *= -1;
          var ctg = function(x) { return Math.cos(x) / Math.sin(x); };

          var direction = clockwise ? -1 : 1;

          var startPoint = angleToPoint(startAngle),
              startSideProgress = sideProgress(startAngle),
              edgeStops = [],
              edgePoints = [];
          (function() {
            var currentStop = angleNormalize(startAngle + Math.PI / 4) % 0.25;
            if (currentStop === 0) currentStop += 0.25;

            edgeStops.push(currentStop);

            var currentEdgePoint = [horizontalSide(startAngle), verticalSide(startAngle)];
            if (currentEdgePoint[0] === 0) currentEdgePoint[0] = direction * currentEdgePoint[1];
            else currentEdgePoint[1] = -direction * currentEdgePoint[0];

            edgePoints.push(currentEdgePoint);

            for (var i = 0; i < 3; i++) {
              currentStop += 0.25;
              edgeStops.push(currentStop);

              currentEdgePoint = currentEdgePoint.slice();
              if (currentEdgePoint[0] === currentEdgePoint[1]) currentEdgePoint[clockwise ? 0 : 1] *= -1;
              else currentEdgePoint[clockwise ? 1 : 0] = currentEdgePoint[clockwise ? 0 : 1];

              edgePoints.push(currentEdgePoint);
            }
          })();

          return function(t) {
            if (t === 1) return [[-1, -1], [1, -1], [1, 1], [-1, 1]];

            var ps = [[0, 0], startPoint];

            var i;
            for (i = 0; i < 4; i++) {
              if (edgeStops[i] < t) {
                ps.push(edgePoints[i]);
              } else {
                if (edgeStops[i] === t) {
                  ps.push(edgePoints[i]);
                  return ps;
                } else {
                  break;
                }
              }
            }
            //console.log(t);
            
            var angle = startAngle + direction * t * 2 * Math.PI;
            var sp = sideProgress(angle);

            var endPoint = [horizontalSide(angle), verticalSide(angle)];

            if (endPoint[0] === 0) endPoint[0] = -direction * (-1 + (endPoint[1] === 1 ? 1 - sp : sp) * 2);
            else endPoint[1] = -direction * (-1 + (endPoint[0] === -1 ? 1 - sp : sp) * 2);

            ps.push(endPoint);

            return ps;
          };

          function horizontalSide(angle) {
            angle = angleNormalize(angle + Math.PI / 4);
            if (angle >= 0 && angle <= 0.25) return 1;
            else if (angle >= 0.5 && angle <= 0.75) return -1;
            else return 0;
          }
          function verticalSide(angle) {
            angle = angleNormalize(angle - Math.PI / 4);
            if (angle >= 0 && angle <= 0.25) return -1;
            else if (angle >= 0.5 && angle <= 0.75) return 1;
            else return 0;
          }
          function angleToPoint(angle) {
            var point = [horizontalSide(angle), verticalSide(angle)];
            if (point[0] === 0) point[0] = -point[1] * ctg(angle);
            else point[1] = -point[0] * Math.tan(angle);
            return point;
          }

          // uses direction arg
          function sideProgress(angle) {
            var progress;
            if (horizontalSide(angle) === 0) progress = (1 - direction * ctg(angle)) / 2;
            else progress = (1 + direction * Math.tan(angle)) / 2;
            return progress;
          }
        }
        function scalePolygonPointsMorphism(f, cx, cy, halfWidth, halfHeight) {
          return function(t) {
            return f(t).map(function(p) {
              return [
                cx + p[0] * halfWidth,
                cy + p[1] * halfHeight
              ];
            });
          };
        }

        function segmentPolar(cx, cy, innerRadius, outerRadius, fromAngle, toAngle) {
          return function(g) {
            if (outerRadius < innerRadius) {
              var t; // swap
              t = innerRadius, innerRadius = outerRadius, outerRadius = t;
            }

            var p1 = toCartesian(fromAngle, innerRadius),
                p2 = toCartesian(fromAngle, outerRadius),
                p3 = toCartesian(toAngle, outerRadius),
                p4 = toCartesian(toAngle, innerRadius);

            return g.append('path'
              ).attr('d',
                'M ' + p1.x + ' ' + p1.y + ' ' +
                'L ' + p2.x + ' ' + p2.y + ' ' +
                'A ' + outerRadius + ' ' + outerRadius + ' 0 0 1 ' + p3.x + ' ' + p3.y + ' ' +
                'L ' + p4.x + ' ' + p4.y + ' ' +
                'A ' + innerRadius + ' ' + innerRadius + ' 0 0 0 ' + p1.x + ' ' + p1.y
              );
          };
        }

        function arcPolar(distance, fromAngle, toAngle) {
          return function(g) {
            var arcStart = toCartesian(fromAngle, distance),
                arcEnd = toCartesian(toAngle, distance);

            return g.append('path'
              ).attr('d',
                'M ' + arcStart.x + ' ' + arcStart.y +
                ' A ' + distance + ' ' + distance + ' ' + 0 + ' 0 1 ' + arcEnd.x + ' ' + arcEnd.y);
          };
        }

        function toCartesian(r, d) {
          return {x: Math.cos(r) * d, y: Math.sin(r) * d};
        }

        function linePolar(r1, d1, r2, d2) {
          return function(g) {
            return g.append('line'
              ).attr('x1', Math.cos(r1) * d1
              ).attr('y1', Math.sin(r1) * d1
              ).attr('x2', Math.cos(r2) * d2
              ).attr('y2', Math.sin(r2) * d2);
          }
        }
        
        function daysDiff(a, b) {
          var x = Math.abs(a - b);
          if (x > 366 / 2) {
            x = 366 - x;
          }
          return x;
        }

        function angleDiff(a, b) {
          var x = Math.abs(a - b) % (Math.PI * 2);
          if (x > Math.PI) {
            x = 2 * Math.PI - x;
          }
          return x;
        }

        // converts angle from radians to [0; 1], where 0 = 1 = 2pi, 0.5 = pi, 0.25 = pi/2
        function angleNormalize(a) {
          a /= (2 * Math.PI);
          var s = Math.sign(a);
          a = a - s * Math.abs(a | 0);
          if (s < 0) a = 1 - Math.abs(a);
          return a;
        }

        function maybeReverse(array, reverse) {
          if (reverse) array.reverse();
          return array;
        }
      }
    }
  };
}]);
