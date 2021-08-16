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

var restrict = function(req, res, next) {

    if (req.session.passport) {

        next();

    } else {

        res.redirect('/home');

    }
}

var siteAdminRestrict = function (req, res, next) {

    if (req.session.passport) {

        if (req.session.passport.user.role == 'Admin') {  // role is case sensitive

            next();

        } else {

            res.redirect('/home');

        }
    } else {

        res.redirect('/home');
        
    }
}

var restrictWCode = function(req, res, next) {

    if (req.session.passport) {

        next();

    } else {

        res.status(401).send({
            message: 'This is an error!'
         });
    }
}

var siteAdminRestrictWCode = function (req, res, next) {

    if (req.session.passport) {

        if (req.session.passport.user.role == 'Admin') {  // role is case sensitive

            next();

        } else {

            res.status(401).send({
                message: 'This is an error!'
             });
    

        }
    } else {

        res.status(401).send({
            message: 'This is an error!'
         });        
    }
}

module.exports.restrict = restrict;
module.exports.restrictWCode = restrictWCode;
module.exports.siteAdminRestrict = siteAdminRestrict;
module.exports.siteAdminRestrictWCode = siteAdminRestrictWCode;
