 var options = { host:"192.168.100.40", username:"root", password:"" };

var SSHClient = require("./../lib/index.js")(options);
var releaseType = process.argv[2];
SSHClient.on("connected",function (host) {
  console.log("connected");

  sedString = "sed -i -e 's/RELEASE_TYPE=.*$/RELEASE_TYPE=" + releaseType +"/g' /config/etc/hub-app.conf"
  SSHClient.exec(sedString, function(data, lastChunk){ 
    SSHClient.exec("/usr/local/etc/rc.update start", function(data,lastChunk){
    	if (lastChunk) SSHClient.close(); 
    });
  });
});
console.log(SSHClient);
SSHClient.connect();
