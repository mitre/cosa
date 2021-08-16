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

var appRouter = function (config) {
    var express = require('express');
    const bcrypt = require('bcryptjs');
    var router = express.Router();
    var userRestrict = require('./userRestrict');
    console.log("h")

    router.get('/', userRestrict.restrict, function (req, res) {
        res.redirect('/user/profile')
    });

    router.get('/profile', userRestrict.restrict, function (req, res) {

        let sql_systemRoles = `SELECT s.NAME as SYSTEM_NAME, r.NAME as ROLE_NAME FROM system_role sr
        JOIN system_roles_default r ON r.PK_ROLE_ID = sr.FK_ROLE_ID  
        JOIN system s ON s.PK_SYSTEM_ID = sr.FK_SYSTEM_ID  
        WHERE sr.FK_USER_ID = ?;`

        req.connection.query(sql_systemRoles, req.session.passport.user.id, function(err, systemRoles){
            if(err)
                systemRoles = [];
            res.render('pages/profile', {
                "username": req.session.passport.user.firstname,
                "firstname": req.session.passport.user.firstname,
                "mi": req.session.passport.user.mi,
                "lastname": req.session.passport.user.lastname,
                "role": req.session.passport.user.role,
                "email": req.session.passport.user.email,
                "phone": req.session.passport.user.phone,
                "systemRoles": systemRoles
            });

        });
        
    });

    router.post('/updateUserInfo', userRestrict.restrict, function (req, res) {
        let firstname = req.body.editUserFirstname;
        let lastname = req.body.editUserLastname;
        let mi = req.body.editUserMi
        let email = req.body.editUserEmail
        let phone = req.body.editUserPhone
        let sql = `UPDATE user SET FIRST_NAME=?, LAST_NAME=?, MI=?, PHONE=?, EMAIL=? WHERE PK_USER_ID=?;`;
        let params = [firstname, lastname, mi, phone, email, req.session.passport.user.id];
        req.connection.query(sql, params, function (err, results) {
            if (err) {
                console.log("SQL Error: /user/updateUserInfo" + err);
                res.status(500).send({
                    'error': 'Something failed!'
                });
            } else {
                req.session.passport.user.firstname = firstname;
                req.session.passport.user.lastname = lastname;
                req.session.passport.user.mi = mi;
                req.session.passport.user.phone = phone;
                req.session.passport.user.email = email;
                res.status(200).send({
                    'message': 'Success'
                });
            }
        });
    });


    router.post('/changePassword', userRestrict.restrict, function (req, res) {
        var oldPassword = req.body.oldPassword;
        var newPassword = req.body.newPassword;
        var sql = "SELECT * FROM user WHERE PK_USER_ID = ? limit 0,1;";
        var params = [req.session.passport.user.id]
        req.connection.query(sql, params, function (err, user) {
            if (err) {
                res.status(400).send({
                    'status': 'failure',
                    'message': 'Something went wrong'
                });
            } else {
                if (user.length == 1) {
                    bcrypt.compare(oldPassword, user[0].PASSWORD, function (err, valid) {
                        if (valid) {
                            bcrypt.genSalt(10, 'a', function (err, salt) {
                                bcrypt.hash(newPassword, salt, function (err, hash) {
                                    if (err) {
                                        res.status(400).send({
                                            'status': 'failure',
                                            'message': 'Something went wrong'
                                        });
                                    } else {
                                        let sql = `UPDATE user SET PASSWORD=? WHERE PK_USER_ID=?;`;
                                        let params = [hash, req.session.passport.user.id]
                                        req.connection.query(sql, params, function (err, result) {
                                            if (err) {
                                                res.status(400).send({
                                                    'status': 'failure',
                                                    'message': 'Something went wrong'
                                                });
                                            } else {
                                                res.status(200).send({
                                                    'status': 'success',
                                                    'message': 'Password Updated'
                                                });
                                            }
                                        });
                                    }
                                });

                            });
                        } else {
                            res.status(200).send({
                                'status': 'wrong',
                                'message': 'Old Password is not valid'
                            });
                        }
                    });
                } else {
                    res.status(400).send({
                        'status': 'failure',
                        'message': 'Unknown User'
                    });
                }
            }
        });
    });

    return router;
}

module.exports = appRouter;
