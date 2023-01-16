const csv = require('csv-parser');
const fs = require('fs');

const filepath = "./input.csv"

Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var week1 = new Date(date.getFullYear(), 0, 4);

  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
    - 3 + (week1.getDay() + 6) % 7) / 7);
}

const rules = [
  { from: "Green", to: "Green", peak: 2, nonPeak: 1, dailyCap: 8, weeklyCap: 55 },
  { from: "Red", to: "Red", peak: 3, nonPeak: 2, dailyCap: 12, weeklyCap: 70 },
  { from: "Green", to: "Red", peak: 4, nonPeak: 3, dailyCap: 15, weeklyCap: 90 },
  { from: "Red", to: "Green", peak: 3, nonPeak: 2, dailyCap: 15, weeklyCap: 90 },
];

const peakHours = {
  0: [{ from: [8, 0, 0], to: [10, 0, 0] }, { from: [16, 30, 0], to: [19, 0, 0] }],
  1: [{ from: [8, 0, 0], to: [10, 0, 0] }, { from: [16, 30, 0], to: [19, 0, 0] }],
  2: [{ from: [8, 0, 0], to: [10, 0, 0] }, { from: [16, 30, 0], to: [19, 0, 0] }],
  3: [{ from: [8, 0, 0], to: [10, 0, 0] }, { from: [16, 30, 0], to: [19, 0, 0] }],
  4: [{ from: [8, 0, 0], to: [10, 0, 0] }, { from: [16, 30, 0], to: [19, 0, 0] }],
  5: [{ from: [8, 0, 0], to: [14, 0, 0] }, { from: [18, 30, 0], to: [23, 0, 0] }],
  6: [{ from: [18, 00, 0], to: [23, 0, 0] }]
}



function groupedRecords(records) {
  return records.reduce((grouped, record) => {
    let date = record.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(record);
    return grouped;
  }, {});
}

function isPeakHour(currentTime) {

  let peakHourForTheDay = peakHours[currentTime.getDay()] // 0,1,2,4

  let rowDate = new Date(currentTime)
  let currentDate = `${rowDate.getFullYear()}-${rowDate.getMonth() + 1}-${rowDate.getDate()}`; // onlyDate

  for (let i = 0; i < peakHourForTheDay.length; i++) {
    let peakStart = new Date(currentDate);
    peakStart.setHours(peakHourForTheDay[i].from[0], peakHourForTheDay[i].from[1], peakHourForTheDay[i].from[2]);
    let peakEnd = new Date(currentDate);
    peakEnd.setHours(peakHourForTheDay[i].to[0], peakHourForTheDay[i].to[1], peakHourForTheDay[i].to[2]);
    if (currentTime >= peakStart && currentTime <= peakEnd) {
      return true;
    }
  }
  return false;

}

function calculateDailyScore(costRows) {
  let dailyScores = {};
  costRows.forEach(element => {
    if (!dailyScores.hasOwnProperty(element.date)) {
      dailyScores[element.date] = {};
    }
    if (!dailyScores[element.date].hasOwnProperty(`${element.from}-${element.to}`)) {
      dailyScores[element.date][`${element.from}-${element.to}`] = 0;
    }
    dailyScores[element.date][`${element.from}-${element.to}`] = Math.min(dailyScores[element.date][`${element.from}-${element.to}`] + element.cost, element.dailyCap)
  });
  return dailyScores;
}

function calculateWeeklyScores(dailyScores) {
  const weeklyScores = {};
  const keys = Object.keys(dailyScores);
  for (const key of keys) {
    let weekNo = new Date(key).getWeek();
    if (!weeklyScores.hasOwnProperty(weekNo)) {
      weeklyScores[weekNo] = {};
    }
    Object.entries(dailyScores[key]).forEach(([route, value]) => {
      let rule = rules.find((rule) => `${rule.from}-${rule.to}` === route);
      if (!weeklyScores[weekNo].hasOwnProperty(route)) {
        weeklyScores[weekNo][route] = 0;
      }
      weeklyScores[weekNo][route] = Math.min(weeklyScores[weekNo][route] + value, rule.weeklyCap);
    });
  }
  return weeklyScores
}



function calculateScore(rows) {

  let costRows = rows.map((row) => {
    let { peak, nonPeak, dailyCap, weeklyCap } = rules.find((rule) => row.from == rule.from && row.to == rule.to);
    if (isPeakHour(row.dateTime)) {
      return { ...row, cost: peak, dailyCap, weeklyCap }
    }
    return { ...row, cost: nonPeak, dailyCap, weeklyCap }
  })

  let dailyScores = calculateDailyScore(costRows);

  let weeklyScores = calculateWeeklyScores(dailyScores);


  const sum = Object.values(weeklyScores).reduce((acc, cur) => acc + Object.values(cur).reduce((a, b) => a + b), 0);
  return sum;
}



let data = [];

fs.createReadStream(filepath)
  .on('error', () => {
    // handle error
    console.log("Error in CSV file")
  })
  .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
  .on('data', (row) => {
    row.dateTime = new Date(row.dateTime)
    row.date = `${row.dateTime.getFullYear()}-${row.dateTime.getMonth() + 1}-${row.dateTime.getDate()}`;
    data.push(row)
  })

  .on('end', () => {
    console.log(calculateScore(data));
  })


