angular.module('asyncm', []).service('M',
[
function() {
  M.nextTickY = function(f, opts) {
    return M(function(callback, y, options) {
      var running = M.timeout(f, 0).run(callback, M.noDelayY);

      var oldCancel = running.cancel;

      opts = opts || {};
      var cancel = opts.cancel || function() { return M.pure(M.CANCELLED); };
      running.cancel = function() {
        return cancel().bind(function(x) {
          if (x === M.CANCELLED) {
            return oldCancel();
          } else {
            return M.pure(null, x);
          }
        });
      };

      return running;
    });
  };
  M.noDelayY = function(f) {
    return M.pureM(f);
  };

  M.tick = function() {
    var args = arguments;
    return M.sleep(0).then(function() {
      return M.pure.apply(null, args);
    });
  };

  M.ALREADY_FINISHED = 'already_finished';
  M.CANCELLED = 'cancelled';
  M.CANNOT_BE_CANCELLED = 'cannot_be_cancelled';

  M.pure = function() {
    var args = arguments;

    return M(function(callback) {
      callback.apply(null, args);
      return M.alreadyFinished();
    });
  };
  M.pureF = function(f) {
    return M(function(callback, y, options) {
      callback(null, f(y, options));
      return M.alreadyFinished();
    });
  };
  M.pureM = function(f) {
    return M(function(callback, y, options) {
      return f(y).run(callback, y, options);
    });
  };

  M.lazy = function(f) {
    var g = function(callback, y, options) {
      var m = f(y);

      g = function(callback, y, options) {
        return m.run(callback, y, options);
      };

      return g(callback, y, options);
    };

    return M(g);
  };
  M.lazyF = function(f) {
    return M.lazy(function(y) { return M.lazyM(f(y)); });
  };
  M.lazyM = function(m) {
    var result = null;
    var awaiters = [];

    var g = function(callback, y, options) {
      g = function(callback) {
        var awaiter = {
          cancelled: false,
          callback: callback
        };

        awaiters.push(awaiter);

        return {
          cancel: function() {
            awaiter.cancelled = true;
            return M.pure(null, M.CANCELLED);
          }
        };
      };

      m.run(function() {
        result = arguments;

        g = function(callback) {
          callback.apply(null, result);
          return M.alreadyFinished();
        };

        g(callback);
        awaiters.forEach(function(awaiter) {
          if (awaiter.cancelled) return;
          g(awaiter.callback);
        });
        awaiters = null;
      }, y, options);

      // TODO: can be cancelled, if nobody else don't want a result
      return M.cannotBeCancelled();
    };

    return M(function() { return g.apply(null, arguments); });
  };

  M.sleep = function(t) { return M(function (callback, y, options) {
    var runned = false, cancelled = false;

    var id = setTimeout(function() {
      runned = true;

      callback(null, y, options);
    }, t);

    return {
      cancel: function() { return M(function (callback) {
        if (runned) { callback(null, M.ALREADY_FINISHED); return; }
        if (cancelled) { callback(null, M.CANCELLED); return; }

        clearTimeout(id);
        cancelled = true;
        callback(null, M.CANCELLED);

        return M.alreadyFinished(); // TODO: cancel of cancel is implementable
      }); }
    };
  });};

  M.timeout = function(f, t) {
    return M.sleep(t).bind(f);
  };

  M.parallel = function(ps, options) {
    if (ps.length === 0) return M.pure(null, []);

    return M(function(callback) {
      options = options || {};
      var errorCatcher = options.errorCatcher,
          drop = options.drop,
          single = options.single;

      if (typeof errorCatcher !== 'function') errorCatcher = function(){};

      var handleError = function(error) {
        callback(error);

        handleError = errorCatcher;
      };
      
      var left = ps.length;

      if (!drop) {
        var results = [];
        for (var i = 0; i < left; i++) results.push(null);
      }

      ps.forEach(function(m, i) {
        m.run(function(error) {
          if (error) {
            handleError(error);
            return;
          }

          if (!drop) {
            results[i] = Array.prototype.slice.call(arguments, 1);
            if (single) results[i] = results[i][0];
          }

          left--;

          if (left === 0) {
            if (drop) callback(null);
            else callback(null, results);
          }
        });
      });

      return M.cannotBeCancelled(); // TODO: can be
    })
  };
  
  M.alreadyFinished = function() {
    return {
      cancel: function() { return M.pure(null, M.ALREADY_FINISHED); }
    };
  };
  M.cannotBeCancelled = function() {
    return {
      cancel: function() { return M.pure(null, M.CANNOT_BE_CANCELLED); }
    };
  };

  function M(run) {
    if (!(this instanceof M)) return new M(run);

    var self = this;

    this.then = function(f) {
      return new M(function(callback, y, options) {
        var forceY = options.forceY;

        var nextRunning = null,
            cancelled = false,
            cancelling = false,
            nextCancelled = false;

        var running = self.run(function() {
          if (!cancelling) {
            var args = arguments;

            var runner;
            if (forceY) {
              runner = y;
            } else {
              runner = function(x) { return x(); };
            }

            nextRunning = runner(function() {
              try {
                var m = f.apply(null, args);
              } catch (e) {
                return M.pure(e);
              }

              if (!(m instanceof M)) {
                debugger;
                return M.pure(new Error('f not returns a M instance!'));
              }

              return m;
            }).run(callback, y, options);
          } else {
            nextCancelled = true;
          }
        }, y);

        var alreadyFinished = false,
            cannotBeCancelled = false;

        return {
          cancel: function() {
            if (cancelled) return M.pure(null, M.CANCELLED);
            if (alreadyFinished) return M.pure(null, M.ALREADY_FINISHED);
            if (cannotBeCancelled) return M.pure(null, M.CANNOT_BE_CANCELLED);

            cancelling = true;

            return running.cancel().bind(function(status) {
              if (status === M.CANCELLED) {
                cancelled = true;
                return M.pure(null, M.CANCELLED);
              } else if (status === M.ALREADY_FINISHED) {
                if (nextCancelled) {
                  cancelled = true;
                  return M.pure(null, M.CANCELLED);
                } else {
                  return nextRunning.cancel().bind(function(nextStatus) {
                    if (nextCancelled) {
                      cancelled = true;
                      return M.pure(null, M.CANCELLED);
                    }

                    switch (nextStatus) {
                    case M.CANCELLED:
                      cancelled = true;
                      return M.pure(null, M.CANCELLED);
                      break;
                    case M.ALREADY_FINISHED:
                      alreadyFinished = true;
                      return M.pure(null, M.ALREADY_FINISHED);
                      break;
                    case M.CANNOT_BE_CANCELLED:
                      cannotBeCancelled = true;
                      return M.pure(null, M.CANNOT_BE_CANCELLED);
                      break;
                    default: throw new Error('Unknown status: ' + nextStatus);
                    }
                  });
                }
              } else if (status === M.CANNOT_BE_CANCELLED) {
                cannotBeCancelled = true;
                return M.pure(null, M.CANNOT_BE_CANCELLED);
              } else {
                throw new Error('Unknown status: ' + status);
              }
            });
          }
        };
      });
    };

    this.bind = function(f) {
      return self.then(function(error) {
        if (error) return M.pure(error);
        else return f.apply(null, Array.prototype.slice.call(arguments, 1));
      });
    };

    this.bindError = function(f) {
      return self.then(function(error) {
        if (error) return f(error);
        else return M.pure.apply(null, arguments);
      });
    };

    this.skip = function(m) {
      return self.bind(function() { return m; });
    };

    this.see = function(f) {
      return self.then(function() {
        f.apply(null, arguments);
        return M.pure.apply(null, arguments);
      });
    };

    this.seeBind = function(f) {
      return self.bind(function() {
        f.apply(null, arguments);
        return M.pure.bind(null, null).apply(null, arguments);
      });
    };

    this.fmap = function(f) {
      return self.bind(function() {
        return M.pure(null, f.apply(null, arguments));
      });
    };

    this.run = function(callback, y, options) {
      if (typeof callback !== 'function') callback = function(){};
      if (typeof y !== 'function') y = M.nextTickY;
      options = options || {};

      return normalizeRunning(run(callback, y, options));
    };

    function normalizeRunning(running) {
      running = running || {};
      running.cancel = running.cancel || function() {
        return M(function(callback) {
          callback(null, M.CANNOT_BE_CANCELLED);
          return M.cannotBeCancelled();
        });
      };
      return running;
    }
  };

  return M;
}]);
