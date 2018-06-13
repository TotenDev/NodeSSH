# NodeSSH

A lightweight SSH Client for Node.js.

[![Build Status](https://secure.travis-ci.org/TotenDev/NodeSSH.png?branch=master)](http://travis-ci.org/TotenDev/NodeSSH)


## About

NodeSSH is a SSH client for node.js. I would call it lightweight, but since it spawns subprocesses, this makes it heavyweight to me. It uses OpenSSH and expect. Make sure you have installed this software.

Use your system's built-in package manager (apt-get,yum,rpm,dselect,etc..) to install expect on you machine. Most systems (OSX included) should already have this installed. This will not work with windows machines.

## Requirements

- [npm](https://github.com/isaacs/npm)
- [OpenSSH](http://www.openssh.org)
- [expect](http://expect.sourceforge.net)

## Installation

Download and install dependencies

    $ npm install

## Usage

    const options = { host:"localhost", username:"USER", password:"PASS" };
    const NodeSSH = require("NodeSSH")
    const SSHClient = NodeSSH.NodeSSH(options);
    SSHClient.on("connected",function (host) {
	    SSHClient.exec("pwd",function(data,lastChunk){ 
	    	console.log("Server response:",data);
	    	if (lastChunk) SSHClient.close(); 
	    });
    })
    SSHClient.connect();

More samples at `samples/` directory.

Alternatively use the promiseWrapper

    const options = {
        host: "HOST",
        username: "USERNAME",
        password: "PASS"
    };
    
    const SSH = require('NodeSSH');

    var mySSH = new SSH.promiseWrapper(options);
    mySSH.connect()
      .then((result) => {
        var options = {};
        options.cwd = '/usr';
        return mySSH.execCommand('ls', options);
      })
      .then((result) => {
        console.log('contents of /user/ is', result.stdout)
        return mySSH.dispose();
      }).then((string) => {
        console.log('SSH session has been closed successfully')
        done();
      })
      .catch(done);

## Methods

### Node-SSH

#### Initialize Wrapper

Parameters:

* options - **Type:**OptionObject - **Description:**Options Object - **REQUIRED**
* options.host - **Type:**string - **Description:**SSH host to be connected - **REQUIRED**
* options.username - **Type:**string - **Description:**SSH username to be authenticated - **REQUIRED**
* options.password - **Type:**string - **Description:**SSH user password OR if certificate is specified is the password used to open certificate. - **OPTIONAL**
* options.certificate - **Type:**string - **Description:**Local SSH key path to authenticate with remote host - **OPTIONAL**
* options.port - **Type:**integer - **Description:**Remote host SSH port - **OPTIONAL** (Default is 22)
* options.colors - **Type:**boolean - **Description:**Use or NOT SSH color syntax - **OPTIONAL** (Default is false)

Sample:

    var options = { host:"localhost", username:"USER", password:"PASS", port: 20890 };
    var SSHClient = require("NodeSSH")(options);
    SSHClient.on("connected",function (host) {
	    SSHClient.close();
    })
    SSHClient.connect();
---
#### Connect Session

This function will try to connect to remote host.

Sample:

    SSHClient.connect();
---
#### Write Command

This function will not call error listener, it'll call 'output'/'input'/'stderr' events.  

Parameters:
- command - **Type:**string - **Description:**Command to be write on remote host. - **REQUIRED**

Sample:

    SSHClient.write("pwd");
---
#### Execute Command
Execute command on remote connection.

Sample:

    SSHClient.on("connected",function (host) {
		SSHClient.exec("pwd",function(data,finished){
			if (finished) { SSHClient.close(); }
		});
	});
---
#### Pause Stream Command

This function will pause child stdout stream (if not paused).  
Since any command executed in the paused session will be processed by the same child (already paused), if you do not pause it, no commands will be executed until.

Sample:

    SSHClient.pauseOutput();
---
#### Resume Stream Command

This function will resume child stdout stream (if paused).

Sample:

    SSHClient.resumeOutput();

---
#### Close session
This method will close SSH session.

Sample:

    SSHClient.close();


## Events

#### Connected 
This event will be fired when SSH Session has being established. You must execute `.connect()` function to start connection process.

Event-String: `connected`

Sample:

	//Connections events
	SSHClient.on("connected",function (host) {
		console.log("Connected to host:",host);
	});
---
#### Closed 
This event will be fired when SSH Session has being closed (with success or not). 
If all goes without errors, you must execute `.close()` function to close connection session.

Event-String: `closed`

Sample:

	//Connections events
	SSHClient.on("closed",function (host,error) {
		if (err) {
			console.log("Error on session",err); 
		}else {
			console.log("Disconnected from host:",host);
		}
	});	
---
#### Output 
This event will be fired when any command is outputed by remote connection (even ours that is outputed by ssh session).

Event-String: `output`

Sample:

	//Command events
	SSHClient.on('output', function(data,finished) {
		if (!finished) {
			console.log("output-> "+data);
		}else { SSHClient.close(); }
	});
---
#### StdErr 
This event will be fired when any errored command is outputted by remote connection.

Event-String: `stderr`

Sample:

	//Command events
	SSHClient.on('stderr', function(err) {
		console.log("stderr-> "+err);
	});


### promiseWrapper

For options parameters see Node-SSH above

For debug run with `DEBUG=promiseWrapper`

To sanity test set DONOTCOMMIT.js and `npm run wrapperTest`

#### constructor
Initialise the object, requires options

Sample:

    var options = {
        host: "HOST",
        username: "USERNAME",
        password: "PASS"
    };
    let mySSH = new SSH.promiseWrapper(options);


#### connect 
Connect to the host specified in the constructor

Sample: 
    
    mySSH.connect().then((result) => {
        console.log(result);
    });
    
#### execCommand
Execute a bash command on the host. Requires the SSH connection to be active

Sample:

    var cmdOptions = {
        cwd: /home
    }
    // Prints the contents of /home
    mySSH.exec('ls', cmdOptions);
    
#### dispose
Dispose of the connection. Can reconnect by calling connect();

Sample:
    
    mySSH.dispose().then((result) => {
        console.log('Attempting to close SSH session\n', result)
    });
        
## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

[MIT](NodeSSH/raw/master/LICENSE)
