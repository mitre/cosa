/*
   Copyright 2021 The MITRE Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var config = {};

config.appname = "MITRE COSA - DevSecOps Compliance Management console"
config.version = "0.0"
config.rserver = { }
config.logo_uri = "/images/COSA_logo.png"
config.usr_placeholder = "/images/user.png"
config.icons = {
    'maintenance': '/images/maintenance.png',
    'add': '/images/add.png',
    'print': '/images/paper.png',
    'checklist': '/images/checklist.png',
}
// port server will run on
config.port = 9999;
config.https = {};
config.https.enabled = false;
config.https.certificate = "./server.cert";
config.https.key =  "./server.key";


config.clamAV = {};
config.clamAV.host = '128.29.34.69';
config.clamAV.port = 3310;
config.clamAV.active = false;

// Mysql connection configurations
config.mysql = {};
config.mysql.host =      process.env.COSA_MYSQL_HOST     || 'localhost';
config.mysql.user =      process.env.COSA_MYSQL_USER     || 'mitre-cosa';
config.mysql.password =  'cosa12345';
config.mysql.database =  process.env.COSA_MYSQL_DATABASE || 'mitre-cosa';

// Session configurations
config.session = {};
config.session.name = "cosaSession";
config.session.resave = true;
config.session.saveUninitialized = true;
config.session.secret = "secretphraseforsession";
config.session.secure = false;

// Feature Flags
config.riskAccepted = {};
config.capabilityMap = {};
config.riskAccepted.show = false;
config.capabilityMap.show = true;

module.exports = config;
