
'use strict';

const shellEscape = require('shell-escape');
const debug = require('debug')('promiseWrapper');

class SSH {
  /**
   * Constructor, called with options object that contains host, username and password
   * for the connection. Does not connect to the host.
   *
   * new SSH(options: host, username, password)
   * @returns {*|Promise.<TResult>}
   */
  constructor(options) {
    debug('created promise wrapper object');
    this.connected = false;
    this.connection = null;
    this.options = options;
    this.connection = require('./NodeSSH.js')(this.options);
    this.connection.on('stderr', function(err) { console.error('Error on StdErr',err); });
  }


  /**
   * Connect to the host specified in the constructor
   *
   * connect()
   * @returns {*|Promise.<Tresult>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.connection.on('closed', reject);
      this.connection.on('connected',(host) => {
        debug('Connecting to host:', host);
        this.connection.removeListener('closed', reject);
        this.connected = true;
        resolve('Connected to host:', host);
      });
      this.connection.connect();
    });
  }

  /**
   * Run a command 'value' on the remote SSH connection, requires active connection
   * @param value {command to be run}
   * @param options {Options object, contains cwd (directory to execute value from)}
   * @returns {*|Promise< stdout: string>}
   */
  execCommand(value, options) {
    return new Promise((resolve, reject) => {
      if (options.cwd) {
        value = `cd ${shellEscape([options.cwd])} 1> /dev/null 2> /dev/null; ${value}`;
      }
      let wholeLine = '';
      this.connection.on('output', (data,lastChunk) => {
        debug('Received output from command', data);
	      if (data) {
          wholeLine += data;
        } else {
          if (lastChunk === true) {
            let res = '';
            this.connection.removeAllListeners('output');
            if (wholeLine.indexOf(value) !== -1) {
              debug('$', value);
              res = wholeLine.replace(value, '');
            } else {
              console.error(`Expected ${value} to be present in ${wholeLine}`);
            }
            let result = {};
            result.stdout = res;
            debug(res);
            resolve(result);
	        }
        }
      });
      debug(`Writing command ${value}`);
      this.connection.write(value);

    });

  }
  /**
   * Disconnects an SSH connection if one is active, returns harmlessly if one is not
   * @returns {*|promise.<TResult>}
   */
  dispose() {
    return new Promise((resolve, reject) => {
      debug('Closing SSH connection')
      if (this.connection.connected === false) {
        debug('SSH connection already closed');
        resolve('SSH session already closed');
        return;
      }
      this.connection.on('closed', function(addr,err) {
        if (err) {
          debug('Error on SSH closed event!');
          throw TypeError("issues");
          reject();
	      } else {
          debug('SSH session has been closed successfully');
          resolve('SSH session has been closed successfully');
        }
      });
      this.connection.close();
    });
  }
}

module.exports = SSH;
