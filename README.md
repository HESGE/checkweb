

# Checkweb goals

* Checkweb is a simple tool written with node.js to check several web services regularly (but without UI)
* All web services to check are declared in a JSON format located in the cfg/services directory
* If there is an issue the checkweb system could send an email alert (depending on the configuration)
* It contains an integrated scheduler

## What is not

* a system monitoring tool (disk, memory, network)

## Able to check

* code 200 answer (by default)
* JSON object
* regular expression

## To do

* Tests (sorry)
* Continuous Test Integration

# Installation

* Install node on your system (could be apt-get install nodejs)

```
>apt-get install nodejs
```

* Install npm (node package manager) (could be apt-get install npm)

```
>apt-get install npm
```
* Clone the git repository on your system

```
>git clone https://github.com/HESGE/checkweb.git
```
* Install npm dependencies

```
>npm install
```


# Test the examples

* In ```cfg``` Directory, copy the ```cfg_example.json``` to ```cfg.json``` (mail alert is disabled by default)

```
>cp cfg/cfg_example.json cfg/cfg.json
```

* And mv the ```services_example``` directory to
```services_example```

```
>mv cfg/services_example cfg/service

```

* And run:

```
>node checkweb.js

```

* you should see bunyan output log (the log system used)

# Run checkweb forever

```
npm install forever
forever start checkweb.js
```
to stop

```forever stop checkweb.js ```

# Configuration

## Main configuration

* Edit ```cfg.json```
* Configure the ```cfg/services``` directory and the email alert address
* supported mail system is given by ```nodemailer``` node module (here is the supported service https://github.com/andris9/nodemailer-wellknown#supported-services), but only gmail was tested
 * for gmail, it is possible you have to decrease the security level of your mail account (so don't use a personal account) and to authorize specifically the application by using this url:  https://g.co/allowaccess

### Example of ```cfg.json```

```json
{
"service_dir" : "./cfg/services/",

"scheduler"       : true,

"mail_alert"      : false,
"alert_only_once" : true,
"alert_reset"     : { "hour":4, "minute": 0},


"mail_service"    : "gmail",
"mail_auth_user"  : "name@gmail.com",
"mail_auth_path"  : "********",
"mail_from"       : "checkweb",
"mail_to"         : "name@gmail.com"
}
```

* ```services_dir```, is the directory where the services are stored
* ```scheduler```, activates scheduler if ```true```, else do it only once
* ```mail_alert```, activates mail alert, if well configurated
   * ```alert_only_once```, activates alert only once during a period of time (to avoid to have to much alert during a day)
      * ```alert_reset```, reset the alert system each period of time

   * ```mail_service```, name of the mail service
   * ```mail_auth_user```, email account
   * ```mail_auth_path```, email password
   * ```mail_from```, name of the mail from
   * ```mail_to```, email account where to send the email

## Services configuration

* Go in ```cfg/services``` directories and create or modify the service JSON files such as ```cfg/services/google-reader.json```

### Example of service

```json
{
"url"       : "https://ajax.googleapis.com/ajax/services/feed/find?v=1.0&q=Official%20Google%20Blogs%27",
"name"      : "google search tool for the feed",
"comment"   : "check that there are some tweets the last few minutes",
"checks"    : [
  { "type" : "json", "keys" : ["response","numFound"], "operator" : ">", "value" : 0 }
],
"freq"  : { "second": 10}
}
```

Where:
* ```url```, is the full url of the web service to check (with params)
* ```name```, is the name of the servie for display purpose
* ```comment```, is the description of what is checked
* ```checks```, is a TABLE wich contain several item to check, depending of the service output:
   * ```type```, is the type of the object to check, could be curently:
      * json
      * regex
   * ```keys```, is the json item to check, here is ```response.numFound```
   * ```operator```, is the operator to apply between ```keys``` and ```value```, could be all the javascript operator:
      * '>'
      * '<'
      * '==='
      * '!=='
      * '>='
      * '<='
   * ```value```, is the value to check
* ```freq```, is the schedular period between to check, in 'hour', 'minute' or 'second'

### Example with regex

```json
{
"url"     : "http://www.google.com/",
"name"    : "Google web site",
"comment" : "check if the google web site is still alive",
"checks"    : [
  { "type" : "regexp", "keys" : "<title>Google</title>"}
],
"freq"    : { "hour": 1}
}
```

## Configure what services to run

* Edit the ```cfg/services/services2check.json```, add lines or comments with underscore to disable the check

## Example:

```json
[
{ "_comment" : "use _ to comment a specific service"},
{ "_service" : "cfg/services/google-reader.json"},
{ "service" : "web-google.json"},
{ "_service" : "web-bitem.json"}
]
```
Here only ```web-google.json``` service is checked. Others are commented thanks to ```_```
