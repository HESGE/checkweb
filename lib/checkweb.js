/*
checkweb : a simple system to check web services
remotely
*/
var cfg         = require('../cfg.json');
var services    = require(cfg.service_dir+'services2check.json');
var bunyan      = require('bunyan');
var nodemailer  = require('nodemailer');
var request     = require('request');
var schedule    = require('node-schedule');


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

exports.testContent = function(ws,response) {
  for (var i in ws.checks) {
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
        log.error('NOT check '+found + ws.checks[i].operator + ws.checks[i].value);
        alertMail(ws.name+' '+ws.url,ws.comment+"\n\n"+'NOT check'+found + ws.checks[i].operator + ws.checks[i].value);
      }

    }
    else {
      log.error(ws.url+' type unknown '+ws.checks[i].type);
    }
  }
}


// testWebService
var testWebService = function(ws) {
  log.info('test Web Service '+ws.url);
  //alertMail('testWebService',ws.url);
  request(ws.url, function (error, response, body) {
    // response is ok
    if (!error && response.statusCode == 200) {
      log.info(ws.url+' = '+response.statusCode);
      testContent(ws,response);
    }
    // http response has an issue
    else {
      var status = '';
      if (typeof response != 'undefined') {
        status = response.statusCode;

      }
      log.error(ws.url+' = '+status+' ERROR='+error);
      alertMail(ws.name+' '+ws.url+' = '+status,' ERROR='+error)
    }
  })
}

// testWebServiceFunc to pass parameter to scheduleJob
var testWebServiceFunc = function (ws){
  return function (){
    testWebService(ws);
  }
};

// loadServices
exports.loadServices = function() {
  log.info('Reading Web services to check');
  for (var i in services) {
    if (typeof services[i].service != 'undefined') {
      log.info('opening service file: '+services[i].service);
      ws[i] = require (cfg.service_dir+services[i].service);
      if (typeof ws != 'undefined' ) {



        log.info('create rule for the scheduler '+ws[i].url);
        // todo add test of freq
        var rule = new schedule.RecurrenceRule();
        console.log(ws[i].freq);
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
        //var job = schedule.scheduleJob(rule, testWebService(ws));
        var job = schedule.scheduleJob(rule, testWebServiceFunc(ws[i]));

        //jobs.push(job);
      }
      else {
        log.error('read error: '+services[i].service);
      }
    }
  }
  alertMail('checkweb is running','just started...')

}

// alertMail
var alertMail = function(subject,text) {
  if (cfg.mail_alert) {
    transporter.sendMail({
        from      : cfg.mail_from,
        to        : cfg.mail_to,
        subject   : subject,
        text      : text
    }, function(error, info){
        if(error){
            log.error(error);
        }else{
            log.info('Message sent: ' + info.response);
        }
    });
  }
}

/* *************************** main ********************  */



// read searvices from json files
//loadServices();
