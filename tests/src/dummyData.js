var __EMPLOYEES_TEST_DATA = (function(){

// moment.js is not immutable
var end = function() { return moment(new Date(1419067898536)); };

// TODO: add fields: birthday, name
// FIXME: or even get some raw data, clear it and generate test data by converting code, that have dataService
return {createdAt: end().toDate(), employees: [
  {id: 1, gender: true, titleHistory: [
    {date: end().subtract(1, 'year').toDate(), title: 'C'},
    {date: end().subtract(2, 'years').toDate(), title: 'B'},
    {date: end().subtract(3, 'years').toDate(), title: 'A'}]},
  {id: 2, gender: true, titleHistory: [
    {date: end().subtract(2, 'months').toDate(), title: 'A'}]},
  {id: 3, gender: false, titleHistory: [
    {date: end().subtract(5, 'months').toDate(), title: 'C'}]}
]};

})();
