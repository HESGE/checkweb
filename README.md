# checkweb goals

checkweb is a simple tool in node.js to check web service regularly without UI

All web services to check are declared in a json format located in the services directory

if there is an issue the checkweb send an email alert

# able to check

* code 200 answer (by default)
* json output value to evaluate


# Installation

* install node on your system (could be apt-get install nodejs)
* install npm (node package manager) (could be apt-get install npm)
* clone git the check web repository on your system
* npm install


# Test

* copy the cfg_example.json to cfg.json (mail alert is disabled by default)
* node checkweb.js
* you should see bunyan output log

# run checkweb forever


* npm install forever
* forever start checkweb.js
* to stop
 * forever stop checkweb.js

# configuration

#configure checkweb

* edit cfg.json
* configure the services directory and the email alert address
* supported mail system is given by 'nodemailer' node module (here is the supported service https://github.com/andris9/nodemailer-wellknown#supported-services), but only gmail was tested
 * for gmail, it is possible you have to decrease the security level of your mail account (so don't use a personal account) and to authorize specifically the application by using this url:  https://g.co/allowaccess


## configure services

Go in services directories and create or modify the service json file

## configure service to run

Edit the services2check.json, add lines or comments with underscore to disable the check
