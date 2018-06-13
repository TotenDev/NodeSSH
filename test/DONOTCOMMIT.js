module.exports = function (useCert) { return new Help(useCert); }
function Help(useCert) {
	HelperInstance = this;
	HelperInstance.useCertificate = (useCert ? useCert : false);
}
Help.prototype.TESTHost = function () { 
	if (HelperInstance.useCertificate == false) { return "10.0.1.7"; }
	else { return "10.0.1.19"; }
}
Help.prototype.TESTPass = function () { 
	if (HelperInstance.useCertificate == false) { return "myPass"; }
	else { return "MyCertPass"; }
}
Help.prototype.TESTUser = function () { 
	if (HelperInstance.useCertificate == false) { return "olooo"; }
	else { return "oluu"; }
}
Help.prototype.TESTPort = function () { 
	return "22";
}
Help.prototype.TESTCertificateFile = function () {
	if (HelperInstance.useCertificate == false) { return ""; }
	else { return "~/.ssh/id_ioio"; }
}