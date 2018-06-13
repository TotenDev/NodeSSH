'use strict';

let assert = require('assert');

var credentials = require('./DONOTCOMMIT.js')();
var options = {
  host: credentials.TESTHost(),
  username: credentials.TESTUser(),
  password: credentials.TESTPass(),
  port: credentials.TESTPort(),
  colors: false
};

const SSH = require('../index.js')(options);

describe('Wrapper sanity check', function() {
  this.timeout(10000);
  /*
   * Basic test that the SSH library can talk to the device
   * configure DONOTCOMMIT.js with address username and password 
   *
   */
  it('should connect to a hub, run a command and disconnect', function(done) {
    console.log(SSH);
    var mySSH = new SSH.promisify(options);
    mySSH.connect()
      .then((result) => {
        var options = {};
        options.cwd = '/usr';
        return mySSH.execCommand('ls', options);
      })
      .then((result) => {
        assert.equal(result.stdout, 'bin    local  sbin   share');
        return mySSH.dispose();
      }).then((string) => {
        assert.equal(string, 'SSH session has been closed successfully', 'ssh session has been closed');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
