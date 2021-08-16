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

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var mysql2 = require('mysql2/promise');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var fs = require('fs');
var uuid = require('uuid/v4');
var config = require('./config');

const helmet = require('helmet')
const cors = require('cors');

const rev = fs.readFileSync('.git/HEAD').toString();

var mysqlOptions = {
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
};

var connection = mysql.createConnection(mysqlOptions);

const mysql2_pool = mysql2.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  database: config.mysql.database
});

connection.connect(function (err) {
  if (err) {
    console.error("MySQL connection error: " + err);
    console.error("Stopping the app.");
    process.exit();
  } else {
    console.info("Connected to MySQL");
    // Keeps connection from Inactivity Timeout
    setInterval(function () {
      connection.ping();
    }, 60000);
  }
});

var sessionStore = new MySQLStore(mysqlOptions);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet());
app.use(cors());

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ limit: '50mb', 'extended': 'true', parameterLimit: 50000 }));

app.use(cookieParser());

// From https://stackoverflow.com/questions/21566912/modify-response-header-with-sails-js-for-implementing-hsts
app.use(function hsts(req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  next();
});

app.disable('x-powered-by');

app.use(function (req, res, next) {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://cdn.datatables.net https://cdnjs.cloudflare.com");
  next();
});
app.use(session({
  genid: (req) => {
    return uuid() // use UUIDs for session IDs
  },
  name: config.session.name,
  resave: true,
  saveUninitialized: true,
  secret: config.session.secret,
  cookie: { secure: config.session.secure},
  store: sessionStore
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  req.connection = connection;
  req.mysql2_pool = mysql2_pool;
  req.config = config;

  res.locals = {
    appname: config.appname,
    version: config.version,
    config: config,
    validSession: req.session.passport ? true : false,
    username: '',
    role: req.session.passport ? (req.session.passport.user ? req.session.passport.user.role : false) : false,
    mySystems: []
  };

  if (req.session.passport != undefined) {
    res.locals.username = req.session.passport.user.username;
  }

  if (rev.indexOf(':') === -1) {
    res.locals.gitVersion = rev;
  } else {
    res.locals.gitVersion = fs.readFileSync('.git/' + rev.substring(5).trim()).toString();
  }
  if (req.session.passport) {
    mySystems(req, res, next)
  } else {
    next();
  }
});

function mySystems(req, res, next) {
  let sql = "SELECT PK_SYSTEM_ID, NAME, ACRONYM FROM system ORDER BY ACRONYM;";
  req.connection.query(sql, function (err, mySystems) {
    if (err) {
      console.error("SQL Error: " + err + sql);
      res.status(200).send({
        'message': 'Error'
      });
    } else {
      res.locals.mySystems = mySystems;
      next();
    }
  });
}

require('./config/passport.js')(app);

//new router passed in
var index = require('./routes/index')(config);
app.use('/', index);

var setup = require('./routes/setup')(config);
app.use('/setup', setup);

var authRoute = require('./routes/authRoute')(config);
app.use('/auth', authRoute);

var system = require('./routes/system')(config);
app.use('/system', cors(), system);

var secControl = require('./routes/secControl')(config);
app.use('/secControl', secControl);

var testsets = require('./routes/testsets')(config);
app.use('/testsets', testsets);

var workitems = require('./routes/workitems')(config);
app.use('/workitems', workitems);

var reports = require('./routes/reports')(config);
app.use('/reports', reports);

var audit = require('./routes/audit')(config);
app.use('/audit', audit);

var configroute = require('./routes/configroute')(config);
app.use('/config', configroute);

var validate = require('./routes/validate')(config);
app.use('/validate', validate);

var userRoute = require('./routes/user')(config);
app.use('/user', userRoute);

var wizard = require('./routes/wizard')(config);
app.use('/wizard', wizard);

var systemInfoNext = require('./routes/wizard/systemInfoNext')(config);
app.use('/systemInfoNext', systemInfoNext);

var catalogsInfoNext = require('./routes/wizard/catalogsInfoNext')(config);
app.use('/catalogsInfoNext', catalogsInfoNext);

var inheritancesInfoNext = require('./routes/wizard/inheritancesInfoNext')(config);
app.use('/inheritancesInfoNext', inheritancesInfoNext);

var componentsInfoNext = require('./routes/wizard/componentsInfoNext')(config);
app.use('/componentsInfoNext', componentsInfoNext);



app.use('/static', express.static('scripts/helpers'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {

  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.status === 404) {
    res.status(err.status);
    res.render('pages/404', { config: config });
  } else {
    // render the error page
    res.status(err.status || 500);
    res.render('pages/error', { config: config });
  }

});

module.exports = app;
