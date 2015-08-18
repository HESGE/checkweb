var cfg         = require('./cfg.json');
var webGoogle   = require('./services/web-google.json');
var checkweb    = require('../lib/checkweb.js');
var assert      = require('assert');


// test testContent
describe('checkweb', function(){
  describe('.testWebService(web-google)', function(){
    it('should test the result of a web service', function(){
      checkweb.testWebService(webGoogle,function(error,data){
        if (error) {
          console.log(error);
        }
        assert(data === true);
      });
    });
  });
});
