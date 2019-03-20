const spawn = require('child_process').spawn,
  assert = require('assert'),
  util = require('util'),
  promiseWrapper = require('./promiseWrapper');

module.exports = function(options) {
  return new SSHClient(options);
};

util.inherits(SSHClient, require('events').EventEmitter);

let SSHClientSession;

//Initialize SSHClient APi
function SSHClient(options) {
  SSHClientSession = this;
  //Checks for required values
  if (!options) {
    const errMsg = 'options **REQUIRED** value is not specified.';
    util.debug(errMsg); assert.ok(errMsg);
  } else if (!options['host']) {
    const errMsg = 'host **REQUIRED** value is missing on SSHClient Session initialization.';
    util.debug(errMsg); assert.ok(errMsg);
  } else if (!options['username']) {
    const errMsg = 'username **REQUIRED** value is missing on SSHClient Session initialization.';
    util.debug(errMsg); assert.ok(errMsg);
  }

  //Set required values
  SSHClientSession.host = options['host'];
  SSHClientSession.username = options['username'];
  //Set optional values
  if (options && options['port']) { SSHClientSession.port = options['port']; }
  else { SSHClientSession.port = 22; }
  //Are color enabled
  if (options && options['colors']) { SSHClientSession.sshColors = options['colors']; }
  else { SSHClientSession.sshColors = false; }
  //PASSWORD
  if (options && options['password']) {
    SSHClientSession.password = options['password'];
    SSHClientSession.cert = 'null';
  }
  //Check for certificate AFTER PASSWORD, so password will have the preference...
  else {
    SSHClientSession.password = 'null';
    if (options && options['certificate']) { SSHClientSession.cert = options['certificate']; }
    else { SSHClientSession.cert = 'null'; }
  }
  //Helpers
  SSHClientSession.connected = false;
  SSHClientSession.child = null;
  SSHClientSession.paused = false;
  SSHClientSession.overBufffer = '';
}

SSHClient.prototype.connect = function connect() {
  if (SSHClientSession.connected === true || SSHClientSession.child) {
    //Log
    var errMsg = 'SSHClient Session alerady have SSH child stabilished! Disconnecting and opening a new SSH session :)';
    util.debug(errMsg);
    SSHClientSession.close(null); //Close
    SSHClientSession.connect(); //Recall connect
    return;
  }
  // Create Child
  SSHClientSession.child = spawn('expect', [__dirname + '/login.exp', SSHClientSession.host, SSHClientSession.username,
    SSHClientSession.password, SSHClientSession.port, SSHClientSession.cert]);

  //Stdout data
  SSHClientSession.child.stdout.on('data',function(data) {
    return SSHClientSession.read(data.toString());
  });
  //Stderr data
  SSHClientSession.child.stderr.on('data',function(data) {
    return SSHClientSession.emit('stderr',data.toString());
  });
  //Child exit
  SSHClientSession.child.on('exit',function() {
    return SSHClientSession.close(null);
  });
};

SSHClient.prototype.exec = function exec(cmd, callback) {
  //Checks for required values
  if (!cmd || !typeof cmd === 'string') {
    const errMsg = 'cmd **REQUIRED** value on exec() is missing or not a string.';
    util.debug(errMsg); assert.ok(errMsg); return;
  }
  else if (!callback || !typeof callback === 'function') {
    const errMsg = 'callback **REQUIRED** value on exec() is missing or not a function.';
    util.debug(errMsg); assert.ok(errMsg); return;
  }
  // Write command
  SSHClientSession.write(cmd);
  // Get
  const f = function(data,lastChunk) {
    if (lastChunk) { SSHClientSession.removeListener('output',f); }
    callback(data,lastChunk);
  };
  SSHClientSession.on('output',f);
};

SSHClient.prototype.pauseOutput = function pauseOutput() {
  if (SSHClientSession.connected === true && SSHClientSession.child && SSHClientSession.child.stdout &&
		!SSHClientSession.paused) {
    SSHClientSession.child.stdout.pause();
    SSHClientSession.paused = true;
  }
};

SSHClient.prototype.resumeOutput = function resumeOutput() {
  if (SSHClientSession.connected === true && SSHClientSession.child && SSHClientSession.child.stdout &&
		SSHClientSession.paused === true) {
    if (SSHClientSession.overBufffer.length > 0) { SSHClientSession.read(''); }
    SSHClientSession.child.stdout.resume();
    SSHClientSession.paused = false;
  }
};

SSHClient.prototype.write = function write(data) {
  return SSHClientSession.child && SSHClientSession.child.stdin.writable ?
    SSHClientSession.child.stdin.write(data + '\r') : false;
};

SSHClient.prototype.read = function read(data) {
  if (!data) {
	  return;
  }

  // Remove colors if needed
  if (!SSHClientSession.sshColors || SSHClientSession.sshColors === false) {
	  data = data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,'');
  }

  // Check if is connected
  if (SSHClientSession.connected === true) {
    // Check if have over buffer and append into data
    if (SSHClientSession.overBufffer.length > 0) {
      data = SSHClientSession.overBufffer + data;
      SSHClientSession.overBufffer = '';
    }
    // Check is have last command on in
    var isLast = false;
    if (data.match(/[#|$]\s$/)) { isLast = true; }
    //Send each line by output
    var lines = data.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var str = lines[i];
      if (str) { //Valid ?
        if (SSHClientSession.paused === true) { //Check if has paused
          SSHClientSession.overBufffer = SSHClientSession.overBufffer + str + '\n';
        } else if (isLast === true && i + 1 === lines.length) { //Check if last command is being piped
          SSHClientSession.emit('output',null,isLast);
        } else {	//Normal command
          str = str.replace('\r','');
          SSHClientSession.emit('output',str,false);
        }
      }
    }
  } else { // Test for connection or connection errors
    const connectResponses = [
      'Logged',
      'Connection refuse',
      'ssh: Could not',
      'Permission denied',
      'Login failed',
      'No password is specified'
    ];

    for (let response = 0; response < connectResponses.length; response++) {
      if (data.indexOf(connectResponses[response]) > -1) {
        if (response === 0) { // Log in successful
          SSHClientSession.connected = true;
          SSHClientSession.emit('connected',SSHClientSession.host);
        } else { // Log in error
          console.error('Connection Error: ',data);
          return SSHClientSession.close(data);
        }
      }
    }
  }
};

SSHClient.prototype.close = function close(errorString) {
  if (SSHClientSession.child && SSHClientSession.child.kill) {SSHClientSession.child.kill();}
  //Clean
  SSHClientSession.connected = false;
  if (SSHClientSession.child) {
    SSHClientSession.child.removeAllListeners('exit');
    SSHClientSession.child = null;
    //Emit close
    SSHClientSession.emit('closed',SSHClientSession.host,errorString);
  }
};

SSHClient.prototype.promisify = function promisify(options) {
  return new promiseWrapper(options);
};
