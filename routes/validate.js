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

var appRouter = function(config){

var express = require('express');
var router = express.Router();
var userRestrict = require('./userRestrict');

const test_validate_promise = require('../scripts/test_validate/test_validate_promise.js');
const test_hybrid_validate_promise = require('../scripts/test_validate/test_hybrid_validate_promise.js');


console.log(`PWD = ${process.cwd()}`);
var config = require('../config');

router.get('/validatehybridtestsreport', userRestrict.siteAdminRestrict, function (req, res) {
        test_hybrid_validate_promise(config).spread( (connection, results) => {
            connection.end();

            console.log(`Validation report contains ${results.length} records`);
            res.render('pages/hybridreport', {
                config: config,
                items: results
            });
        }).catch(err => {
            console.error('Promise Exception Caught:');
            console.error(`err: ${err}`);
            if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);
            if (connection != null) connection.end()
            res.statusCode(500).send('Internal Error!');
        });

});
router.get('/validatetestsreport', userRestrict.siteAdminRestrict, function (req, res) {
    test_validate_promise(config).spread( (connection, results) => {
        connection.end();

        console.log(`Validation report contains ${results.length} records`);
        res.render('pages/validationreport', {
            config: config,
            items: results
        });
    }).catch(err => {
        console.error('Promise Exception Caught:');
        console.error(`err: ${err}`);
        if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);
        if (connection != null) connection.end()
        res.statusCode(500).send('Internal Error!');
    });

});



router.get('/getValidationInfo', userRestrict.siteAdminRestrictWCode, function (req, res) {
        test_validate_promise(config).spread( (connection, results) => {
            connection.end();

            console.log(`Validation report contains ${results.length} records`);
            res.render('pages/validationexport', {
                config: config,
                items: results
            });
        }).catch(err => {
            console.error('Promise Exception Caught:');
            console.error(`err: ${err}`);
            if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);
            if (connection != null) connection.end()
            res.statusCode(500).send('Internal Error!');
        });

});
return router;
}
module.exports = appRouter;
