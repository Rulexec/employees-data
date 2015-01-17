describe('M', function() {
  beforeEach(module('asyncm'));

  var M;
  beforeEach(inject(['M', function(_M_) {
    M = _M_;
  }]));

  describe('.pure', function() {
    it('binds on non-error', function(done) {
      M.pure(null, 'answer', 42).bind(function(text, number) {
        return M.pure(null, 'The ' + text[0].toUpperCase() + text.slice(1) + ' is ' + number);
      }).run(function(error, s) {
        expect(error).not.toBeTruthy();
        expect(s).toBe('The Answer is 42');
        setTimeout(done, 0);
      });
    });

    it('then', function(done) {
      M.pure('scary', 13).then(function(scary, thirteen) {
        return M.pure(null, scary + ' ' + thirteen);
      }).run(function(error, s) {
        expect(error).not.toBeTruthy();
        expect(s).toBe('scary 13');
        setTimeout(done, 0);
      });
    });

    it('bindError not calls on non-error', function(done) {
      M.pure(null, 'no error').bindError(function(error) {
        expect('').toBe('Failed');
      }).run(function(error, s) {
        expect(error).not.toBeTruthy();
        expect(s).toBe('no error');
        setTimeout(done, 0);
      });
    });

    it('bindError', function(done) {
      M.pure('some-error').bindError(function(error) {
        expect(error).toBe('some-error');
        return M.pure('other-error');
      }).bind(function() {
        expect('').toBe('Should not be runned');
      }).bindError(function(error) {
        expect(error).toBe('other-error');
        return M.pure(null, 'no error');
      }).run(function(error, s) {
        expect(error).not.toBeTruthy();
        expect(s).toBe('no error');
        setTimeout(done, 0);
      });
    });
  });

  describe('.timeout accepts function, that returns async and timeout in ms', function() {
    var TIMEOUT = 30;

    it('runs function after this timeout and runs returned async', function(done) {
      var startTime = new Date().getTime();

      M.timeout(function() {
        return M.pure(null, new Date().getTime());
      }, 100).run(function(error, time) {
        expect(error).not.toBeTruthy();

        expect(time - startTime >= TIMEOUT).toBe(true);
        done();
      });
    });
  });

  describe('.parallel accepts array of asyncs', function() {
    it('forms async, that returns array of arrays of success results', function(done) {
      M.parallel([
        M.pure(null, 42),
        M.timeout(function() { return M.pure(null, 13); }, 5)
      ]).run(function(error, results) {
        expect(error).not.toBeTruthy();

        expect(deepEqual(results, [[42], [13]])).toBe(true);
        
        done();
      });
    });
  });

  function deepEqual(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      for (var i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }

      return true;
    } else {
      return a === b;
    }
  }
});
