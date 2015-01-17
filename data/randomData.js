var people = [];

var fromTime = new Date('2007-10-11').getTime(),
    endTime = new Date('2013-03-10').getTime(),
    timeDiff = endTime - fromTime,
    nowTime = new Date().getTime();

for (var i = 0; i < 150; i++) {
  people.push({
    Id: i,
    NativeName: '',
    Gender: (Math.random() * 2) | 0,
    TitleHistory: randomTitleHistory(),
    Birthday: randomBirthday()
  });
}

process.stdout.write(JSON.stringify(people));

function randomTitleHistory() {
  return [{Date: randomAspDateInInterval(fromTime, endTime), Title: 'Nobody'}];
}
function randomBirthday() {
  return randomAspDateInInterval(
    nowTime - (40 * 365.4 * 24 * 60 * 60 * 1000),
    nowTime - (17 * 365.4 * 24 * 60 * 60 * 1000)
  );
}
function randomAspDateInInterval(min, max) {
  var time = Math.floor(randomInInterval(min, max));
  return '/Date(' + time + '-0000)/';
}

function randomInInterval(min, max) {
  return min + Math.random() * (max - min);
}
