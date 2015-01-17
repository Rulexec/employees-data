describe('DataProcessing', function() {
  beforeEach(module('app'));

  var M;
  beforeEach(inject(['M', function(_M_) {
    M = _M_;
  }]));

  var DATA = __EMPLOYEES_TEST_DATA;
  var MALES_COUNT = DATA.employees.reduce(function(acc, x) {
    return acc + (x.gender ? 1 : 0)
  }, 0);

  var dataProcessing = null;
  beforeEach(function(done) {
    inject(['DataProcessing', function(DataProcessing) {
      DataProcessing.create(DATA).bind(function(_dataProcessing) {
        dataProcessing = _dataProcessing;
        return M.pure(null);
      }).bindError(function(error) {
        console.error('beforeEach, create DataProcessing error: ', error);
        return M.pure(null);
      }).run(function(){ setTimeout(done, 0);});
    }]);
  });

  describe('.sets', function() {
    it('.all()~>size() == 3', function(done) {
      dataProcessing.sets.all().bind(function(x) { return x.size(); }).run(function(error, x) {
        expect(error).not.toBeTruthy();

        expect(x).toBe(3);

        setTimeout(done, 0);
      });
    });
  });

  describe('.filter', function() {
    it('should return new DataProcessing, that processing filtered data set', function(done) {
      dataProcessing.filter({gender: {female: false}}).bind(function(filtered) {
        return M.parallel([
          filtered.sets.all().bind(function(x) { return x.size(); }).bind(function(size) {
            expect(size).toBe(MALES_COUNT);
            return M.pure(null);
          }),
          filtered.sets.gender.female().bind(function(x) { return x.size(); }).bind(function(size) {
            expect(size).toBe(0);
            return M.pure(null);
          })
        ]);
      }).run(function(error) {
        expect(error).not.toBeTruthy();

        setTimeout(done, 0);
      });
    });
  });

  describe('.setSizeTimeFunction', function() {
    describe('.discrete()~>all()', function() {
      it('should return list of discrete values of size of set depending on time and hire dates', function() {
        dataProcessing.sets.all().bind(function(x) { return dataProcessing.setSizeTimeFunction(x); }
        ).bind(function(x) { return x.discrete(); }).bind(function(x) { return x.all(); }
        ).bind(function(discrete) {
          expect(Array.isArray(discrete)).toBeTruthy();
          console.log(discrete);

          // TODO
          return M.pure(null);
        }).run(function(error) {
          expect(error).not.toBeTruthy();
        });
      });
    });
  });
});
