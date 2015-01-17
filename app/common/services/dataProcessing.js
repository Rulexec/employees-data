angular.module('app').service('DataProcessing',
['M',
function(M) {
  DataProcessing.NOT_FOUND = 'not_found';

  function DataProcessing(options) {
    var self = this;

    var data = options.data;

    var allSet = new EmployeeSet(data.employees);

    function getEmployeeHireDate(x) {
      return x.titleHistory[x.titleHistory.length - 1].date;
    }

    this.time = {
      from: lazy(function() { return M.lazy(function() { // TODO: replace with cancellable
        return M.pure(null, data.employees.reduce(function(minDate, el) {
          var hireDate = getEmployeeHireDate(el);
          return hireDate < minDate ? hireDate : minDate;
        }, data.createdAt));
      }); }),
      to: lazy(function() { return M.pure(null, data.createdAt); }),

      range: lazy(function() { return M.lazyM(
        self.time.from().bind(function(from) {
          return self.time.to().bind(function(to) {
            return M.pure(null, from, to);
          });
        })
      ); })
    };

    this.titles = {
      all: lazy(function() { return M.lazy(function() {
        var titlesSet = {};

        data.employees.forEach(function(employee) {
          employee.titleHistory.forEach(function(title) {
            titlesSet[title.title] = true;
          });
        });

        var titlesList = [];

        for (var name in titlesSet) if (titlesSet.hasOwnProperty(name)) {
          titlesList.push(name);
        }

        return M.pure(null, titlesList);
      }).bind(function(x) { return M.pure(null, x.slice()); }); })
    };

    this.sets = {
      all: lazy(function() { return M.pure(null, allSet); }),
      gender: {
        male: lazy(function() { return M.lazyM(allSet.filter(function(x) { return x.gender === true; })); }),
        female: lazy(function() { return M.lazyM(allSet.filter(function(x) { return x.gender === false; })); })
      },
      category: {
        other: lazy(function() { return M.lazyF(function() {
          var m = M.pure(null, allSet);

          for (var name in self.sets.category) if (self.sets.category.hasOwnProperty(name) && name !== 'other') {
            m = (function(m, setM) {
              return m.bind(function(x) {
                return setM.bind(function(y) {
                  return x.subtract(y);
                });
              });
            })(m, self.sets.category[name]);
          }

          return m;
        }); })
      },
      rank: {
        junior: lazy(function() { return M.lazyF(function() {
          return allSet.filter(function(x) {
            return (/.*junior.*/i).test(x.titleHistory[0].title);
          });
        }); }),
        senior: lazy(function() { return M.lazyF(function() {
          return allSet.filter(function(x) {
            return (/.*senior.*/i).test(x.titleHistory[0].title);
          });
        }); }),
        other: lazy(function() { return M.lazyF(function() {
          var m = M.pure(null, allSet);

          for (var name in self.sets.rank) if (self.sets.rank.hasOwnProperty(name) && name !== 'other') {
            m = (function(m, setM) {
              return m.bind(function(x) {
                return setM().bind(function(y) {
                  return x.subtract(y);
                });
              });
            })(m, self.sets.rank[name]);
          }

          return m;
        }); }),
      }
    };

    this.setSizeTimeFunction = function(set) {
      return M.pureF(function() {
        return {
          discrete: function() { return M.pureF(function() {
            return {
              all: function() { return M.lazy(function() {
                var employees = set.__list();

                if (employees.length === 0) return M.pure(null, []);
                var result = employees.map(getEmployeeHireDate).sort(function(a, b) { return a - b; });

                result = result.slice(1).reduce(function(acc, x) {
                  var last = acc[acc.length - 1];
                  if (x <= last[0]) { // cannot be <, but anyway
                    last[1]++;
                  } else {
                    acc.push([x, last[1] + 1]);
                  }

                  return acc;
                }, [[result[0], 1]]);

                return M.pure(null, result);
              });}
            };
          }); }
        };
      });
    };

    this.filter = function(filters) {
      return M.pureM(function() {
        var filter = function() { return true; }; // FIXME, not include this in resulting filter somehow
        var filterM = function() { return M.pure(null, true); };
        var m = M.pure(null);

        var categories = {},
            ranks = {};

        if (filters.gender) {
          if (filters.gender.male === false) {
            addFilter(function(x) { return x.gender !== true; });
          }
          if (filters.gender.female === false) {
            addFilter(function(x) { return x.gender !== false; });
          }
        }
        if (filters.time) {
          if (filters.time.from !== undefined) {
            addFilter(function(x) { return getEmployeeHireDate(x) >= filters.time.from; });
          }
          if (filters.time.to !== undefined) {
            addFilter(function(x) { return getEmployeeHireDate(x) <= filters.time.to; });
          }
        }
        if (filters.category) {
          if (filters.category.other === false) {
            addM(self.sets.category.other().seeBind(function(x) { categories.other = x; }));
            addFilterM(function(x) { return categories.other.contains(x).fmap(function(b) { return !b; }); });
          }
        }
        if (filters.rank) {
          if (filters.rank.junior === false) {
            addM(self.sets.rank.junior().seeBind(function(x) { ranks.junior = x; }));
            addFilterM(function(x) { return ranks.junior.contains(x).fmap(function(b) { return !b; }); });
          }
          if (filters.rank.senior === false) {
            addM(self.sets.rank.senior().seeBind(function(x) { ranks.senior = x; }));
            addFilterM(function(x) { return ranks.senior.contains(x).fmap(function(b) { return !b; }); });
          }
          if (filters.rank.other === false) {
            addM(self.sets.rank.other().seeBind(function(x) { ranks.other = x; }));
            addFilterM(function(x) { return ranks.other.contains(x).fmap(function(b) { return !b; }); });
          }
        }
        
        return m.bind(function() {
          var employees = data.employees.filter(filter);

          return M.parallel(employees.map(function(x) { return filterM(x); })).bind(function(filtered) {
            var result = [];

            filtered.forEach(function(b, i) {
              if (b[0]) result.push(employees[i]);
            });

            return M.pure(null, new DataProcessing({
              data: {createdAt: data.createdAt, employees: result} 
            }));
          });
        });

        function addFilter(f) {
          var oldFilter = filter;
          filter = function(x) {
            return oldFilter(x) && f(x);
          };
        }
        function addFilterM(f) {
          var oldFilter = filterM;
          filterM = function(x) {
            return oldFilter(x).bind(function(t) {
              if (t) return f(x);
              else return M.pure(null, false);
            });
          };
        }
        function addM(_m) {
          m = m.skip(_m);
        }
      });
    };
  }

  DataProcessing.create = function(data) {
    return M.pure(null, new DataProcessing({data: data}));
  };

  function EmployeeSet(employees) {
    var self = this;

    var map = {};
    employees.forEach(function(x) {
      map[x.id] = x;
    });

    this.__map = function() { return map; };
    this.__list = function() { return employees; };

    this.list = function() { return M.pure(null, {
      all: function() { return M.pure(null, employees); }
    }); };

    this.size = function() {
      return M.pure(null, employees.length);
    };
    this.filter = function(p) {
      return M.pureF(function() {
        return new EmployeeSet(employees.filter(p));
      });
    };
    this.intersect = function(other) { return M.pureF(function() {
      // TODO: choose littler set first
      var otherMap = other.__map();

      return new EmployeeSet(employees.filter(function(x) {
        return !!otherMap[x.id];
      }));
    }); };
    this.subtract = function(other) { return M.pureM(function() {
      // TODO: can be implemented more efficiently
      return self.intersect(other).bind(function(intersection) {
        var intersectionMap = intersection.__map();

        return M.pure(null, new EmployeeSet(employees.filter(function(x) {
          return !intersectionMap[x.id];
        })));
      });
    }); };
    this.contains = function(x) {
      return M.pure(null, !!map[x.id]);
    };
  }
  EmployeeSet.empty = function() { return new EmployeeSet([]); };

  return DataProcessing;

  function lazy(f) {
    var g = function() {
      var r = f.apply(null, arguments);

      g = function() { return r; };

      return g();
    };

    return function() {
      return g.apply(null, arguments);
    };
  }
}]);
