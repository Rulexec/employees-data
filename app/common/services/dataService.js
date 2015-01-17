angular.module('app').service('dataService',
['M', '$http', 'DataProcessing', 'RAW_DATA_URL', 'RAW_DATA_CREATED_AT',
function(M, $http, DataProcessing, RAW_DATA_URL, RAW_DATA_CREATED_AT) {
  /*
   * {createdAt: Date, employees: [{
   *   id: Number,
   *   gender: true / false / null,
   *   titleHistory: [{date: Date, title: String}],
   *   birthday: Date
   * }}
   *
   * titleHistory is in reversed chronological order, so first title is the last
   */
  var data = null,
      dataProcessing = null;

  this.CONSTANTS = {
    GENDER: {
      MALE: 0, FEMALE: 1
    }
  };

  this.loadData = function(options) {
    return M(function(callback) {
      $http.get(RAW_DATA_URL).then(callback.bind(null, null), callback);
      return M.cannotBeCancelled();
    }).bind(function(response) {
      if (response.status !== 200) return M.pure(response);
      else return convertM(response.data);
    }).bind(function(_data) {
      data = _data;
      return DataProcessing.create(_data);
    }).bind(function(_dataProcessing) {
      dataProcessing = _dataProcessing;
      return M.pure(null);
    });
  };

  this.getDataProcessing = function() {
    return dataProcessing;
  };

  function convertM(raw) { return M(function(callback, y) {
    var mapRaw = {};

    var employees = raw.map(function(x) {
      var id = parseInt(x.Id);

      if (mapRaw[id] !== undefined) throw new Error('Employee duplication: ' + x.Id);
      else mapRaw[id] = x;

      return {
        id: id,
        name: getNativeName(),
        gender: getGender(),
        titleHistory: getTitleHistory(),
        birthday: getBirthday()
      };

      function getNativeName() {
        if (typeof x.NativeName !== 'string') throw new Error('no native name: ' + x.Id);
        return x.NativeName;
      }

      function getGender() {
        switch (x.Gender) {
        case 0: return true;
        case 1: return false;
        default:
          console.warn('Unknown gender: ' + x.Gender);
          return null;
        }
      }

      function getTitleHistory() {
        var history = x.TitleHistory;
        if (!Array.isArray(history)) throw new Error('no history: ' + x.Id);

        return history.map(function(x) {
          return {
            date: moment(x.Date).toDate(),
            title: x.Title
          };
        }).sort(function(a, b) { return b.date - a.date; });
      }

      function getBirthday() {
        var m = moment(x.Birthday);
        return m.isValid() ? m.toDate() : null;
      }
    });

    callback(null, {
      createdAt: RAW_DATA_CREATED_AT,
      employees: employees
    });
  }); }

  this.dataIsNotLoaded = function() {
    return dataProcessing === null;
  };
}]);
