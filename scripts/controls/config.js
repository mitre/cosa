var config = {};

config.appname = "MITRE COSA POC APP"
config.shortappname = 'COSA'
config.orgname = 'COSA/OC/WNMG'
config.logo_uri = './images/cosa_logo.png'
config.version = "0.0"

// port server will run on
config.port = 9000;

config.clamAV.host = '128.29.34.69';
config.clamAV.port = 3310;

// Mysql connection configurations
config.mysql = {}
config.mysql.host = 'localhost';
config.mysql.user = 'cosa';
config.mysql.password = 'admin12345';
config.mysql.database = 'cosa';

// Session configurations
config.session = {};
config.session.name = "cosaSession";
config.session.resave = true;
config.session.saveUninitialized = true;
config.session.secret = "secretphraseforsession";
config.session.secure = true;

module.exports = config;