var schedule    = require('node-schedule');


var rule = new schedule.RecurrenceRule();

rule.minute = new schedule.Range(0, 59, 1);
//rule.hour = ws.freq.hour;


var test = function (color) {

  console.log(color);
}

var color_w = 'white';

schedule.scheduleJob(rule, function(){
    test(color_w);

});

var color_r = 'red';

schedule.scheduleJob(rule, function(){
    test(color_r);

});

var color_b = 'blue';

schedule.scheduleJob(rule, function(){
    test(color_b);

});
