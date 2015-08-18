/*
checkweb : a simple system to check web services
remotely
*/

var cfg         = require('../cfg/cfg.json');
var services    = require(cfg.service_dir+'services2check.json');
var bunyan      = require('bunyan');
var nodemailer  = require('nodemailer');
var request     = require('request');
var schedule    = require('node-schedule');
var os          = require('os');

var hostname = os.hostname();

// contain all info about webservices to check
var ws          = [];




// init of log

var log = bunyan.createLogger({name: 'checkweb'});

// init of mail account

var transporter = nodemailer.createTransport({
    service: cfg.mail_service,
    auth: {
        user: cfg.mail_auth_user,
        pass: cfg.mail_auth_path
    }
});

// testContent
/*jslint evil: true */
testContent = function(ws,response,callback) {
  var ok = true;
  for (var i in ws.checks) {
    //json type check

    if (ws.checks[i].type == 'json') {
      var res = JSON.parse(response.body);
      var found = res;
      // loop on target json keys
      for (var j in ws.checks[i].keys) {
        found = found[ws.checks[i].keys[j]];
      }
      // magic stuff with eval to be able to check any operator beeween found and value
      if (eval(found + ws.checks[i].operator + ws.checks[i].value)) {
        log.info('check '+found + ws.checks[i].operator + ws.checks[i].value);

      }
      else {
        ok = false;
        log.error('NOT check '+found + ws.checks[i].operator + ws.checks[i].value);
        // if a first time alert
        if (!cfg.alert_only_once || !ws.alert) {
          alertMail(ws.name+' '+ws.url,ws.comment+"\n\n"+'NOT check'+found + ws.checks[i].operator + ws.checks[i].value);
          ws.alert = true;
        }
      }
    }
    //regexp type test
    else if (ws.checks[i].type == 'regexp'){
      var re = new RegExp(ws.checks[i].keys);
      if (re.test(response.body)) {
        log.info('check regexp ok' + ws.checks[i].keys);
      }
      else {
        log.error('NOT check regexp '+ ws.checks[i].keys);
        if (!cfg.alert_only_once || !ws.alert) {
          alertMail(ws.name+' '+ws.url,ws.comment+"\n\n"+'NOT check regexp '+ ws.checks[i].keys);
          ws.alert = true;
        }
        ok = false;
      }
    }
    else {
      log.error(ws.url+' type unknown '+ws.checks[i].type);
      ok = false;
    }
  }
  return callback(null,ok);
};


// testWebService
var testWebService = function(ws,callback) {
  var ok = false;
  log.info('test Web Service '+ws.url);
  //alertMail('testWebService',ws.url);
  request(ws.url, function (error, response, body) {
    // response is ok
    if (!error && response.statusCode == 200) {
      log.info(ws.url+' = '+response.statusCode);
      testContent(ws,response,function(error,data){
        ok = data;
      });
    }
    // http response has an issue
    else {
      var status = '';
      if (typeof response != 'undefined') {
        status = response.statusCode;
      }
      log.error(ws.url+' = '+status+' ERROR='+error);
      if (!cfg.alert_only_once || !ws.alert) {
        alertMail(ws.name+' '+ws.url+' = '+status,' ERROR='+error);
        ws.alert = true;
      }
      if (error) {
        //return callback(error);
      }
    }
  });
  //return callback(null,ok);
};

// testWebServiceFunc to pass parameter to scheduleJob
var testWebServiceFunc = function (ws){
  return function (){
    testWebService(ws);
  };
};

// only reset alert after a specific period of time
var resetAlert = function (){
  log.info('resert alert!!!!');
  for (var i in ws) {
    ws[i].alert = false;
  }
};

var resetAlertFunc = function (){
  return function (){
    resetAlert();
  };
};

// displayServicesInfo to the console
var displayServicesInfo = function (error,data) {
  console.log(data);
};

// loadServices
var loadServices = function() {
  log.info('Reading Web services to check');
  var services_str = '';
  for (var i in services) {
    if (typeof services[i].service != 'undefined') {
      log.info('opening service file: '+services[i].service);
      ws[i] = require (cfg.service_dir+services[i].service);
      if (typeof ws != 'undefined' ) {
        //add default alert value
        ws[i].alert = false;

        if (cfg.scheduler) {
          log.info('create rule for the scheduler '+ws[i].url);
          // todo add test of freq
          var rule = new schedule.RecurrenceRule();
          //console.log(ws[i].freq);
          if (ws[i].freq.second>0) {
            rule.second = new schedule.Range(0, 59, ws[i].freq.second);
          }
          if (ws[i].freq.minute>0) {
            rule.minute = new schedule.Range(0, 59, ws[i].freq.minute);
          }
          if (ws[i].freq.hour>0) {
            rule.hour = new schedule.Range(0, 23, ws[i].freq.hour);
          }
          log.info('add job to the scheduler '+ws[i].url);
          services_str += '\n\n'+ws[i].name+'\n'+ws[i].url;
          //var job = schedule.scheduleJob(rule, testWebService(ws));
          var job = schedule.scheduleJob(rule, testWebServiceFunc(ws[i],displayServicesInfo));
        }
        // just one time
        else {
          testWebService(ws[i],displayServicesInfo);
        }
        //jobs.push(job);
      }
      else {
        log.error('read error: '+services[i].service);
      }
    }
  }
  // set the alert reset scheduler
  var ruleAlert = new schedule.RecurrenceRule();
  if (cfg.alert_reset.second>0) {
    ruleAlert.second = new schedule.Range(0, 59, cfg.alert_reset.second);
  }
  if (cfg.alert_reset.minute>0) {
    ruleAlert.minute = new schedule.Range(0, 59, cfg.alert_reset.minute);
  }
  // warning you have to use { "hour":4, "minute": 0} if you want to specify by hour else will be each second (minute is ok alone)
  if (cfg.alert_reset.hour>0) {
    ruleAlert.hour = new schedule.Range(0, 23, cfg.alert_reset.hour);
  }
  var jobAlert = schedule.scheduleJob(ruleAlert, resetAlert);

  // general info alert for feedback
  alertMail('checkweb is running','just started...'+services_str);

};

// alertMail
var alertMail = function(subject,text) {
  if (cfg.mail_alert) {
    transporter.sendMail({
        from      : cfg.mail_from,
        to        : cfg.mail_to,
        subject   : subject+' (from '+hostname+')',
        text      : text
    }, function(error, info){
        if(error){
            log.error(error);
        }else{
            log.info('Message sent: ' + info.response);
        }
    });
  }
};

/* *************************** main ********************  */

module.exports.loadServices   = loadServices;
module.exports.testWebService = testWebService;

// read searvices from json files
//loadServices();
