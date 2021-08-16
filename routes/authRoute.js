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

    const express = require('express');
    const bcrypt = require('bcryptjs');
    const passport = require('passport');

    var userRestrict = require('./userRestrict');

    const router = express.Router();

    // ****** Users Section  *********/
    router.get('/users', userRestrict.siteAdminRestrict, function (req, res) {
        var sql = "SELECT PK_USER_ID, USER_NAME, FIRST_NAME, MI, LAST_NAME, cosa_role.ROLE_NAME, LAST_LOGIN_DATE FROM user INNER JOIN cosa_role ON user.PK_USER_ID = cosa_role.FK_USER_ID;"
        req.connection.query(sql, function (err, results) {
            if (err) {
                //log.error("SQL Error: " + err);
            } else {
                res.render('pages/users', {
                    users: results,
                    config: config
                });
            }
        });
    });

    /* populate user modal */
    router.get('/getUserInfo', userRestrict.siteAdminRestrictWCode, function (req, res) {

        let userID = req.query.userID;

        var sql = "SELECT PK_USER_ID, USER_NAME, FIRST_NAME, MI, LAST_NAME, EMAIL, PHONE, cosa_role.ROLE_NAME, LAST_LOGIN_DATE FROM user INNER JOIN cosa_role ON user.PK_USER_ID = cosa_role.FK_USER_ID WHERE PK_USER_ID = ?;"
        req.connection.query(sql, [userID], function (err, results) {
            if (err) {
                //log.error("SQL Error: " + err + sql);
                res.status(200).send({
                    'message': 'Error'
                });
            } else {
                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    router.post('/addUser', userRestrict.siteAdminRestrictWCode, function (req, res) {

        /* Create a new user account. Admins only capability */

        var username = req.body.username;
        var password = req.body.password;
        var role = req.body.role;
        var firstName = req.body.firstName;
        var MI = req.body.MI;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var phone = req.body.phone;
        bcrypt.genSalt(10, 'a', function (err, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                var active = "1"; //default to an active acount (1)

                var sql = "INSERT INTO user (FIRST_NAME, MI, LAST_NAME, EMAIL, PHONE, USER_NAME, PASSWORD, ACTIVE) VALUES (?,?,?,?,?,?,?,?);";
                var sql_exists = "SELECT COUNT(*) AS userCount FROM user WHERE USER_NAME = ?";

                var params = [firstName, MI, lastName, email, phone, username, hash, active];
                var newUserID;

                // 1st Check if user exists
                req.connection.query(sql_exists, [username], function (err_exists, result_exists) {

                    if (err_exists) {

                        res.send('err_exists');

                    } else if (result_exists[0].userCount == 0) {

                        req.connection.query(sql, params, function (err, result) {

                            if (err) {

                                //log.error('SQL ERR: ' + err);
                                res.send('err');

                            } else {

                                // ADD THE ROLE to cosa_Role table
                                newUserID = result.insertId; // returned from Database INSERT result;

                                if (role != null) {

                                    var sql3 = "INSERT INTO cosa_role (FK_USER_ID, ROLE_NAME) VALUES (?,?);";

                                    req.connection.query(sql3, [newUserID, role], function (err_3, result_3) {

                                        if (err_3) {

                                            //log.error('SQL ERR: ' + err_3);
                                            res.send('err_3');
                                        }

                                    });
                                }

                                //log.info("User Created: " + username);

                                res.status(200).send(result.affectedRows + "user record created");

                            }
                        });

                    } else {

                        //log.warning("Account already exists for user: " + username);
                        res.status(400).send("Account already exists for user :" + username);

                    }
                });
            });
        });
    });

    // Update an existing User Account
    router.post('/updateUser', userRestrict.siteAdminRestrictWCode, function (req, res) {

        var userID = req.body.userID;
        var username = req.body.username;
        var password = req.body.password;
        var role = req.body.role;
        var firstName = req.body.firstName;
        var MI = req.body.MI;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var phone = req.body.phone;
        if (password) { //salt and update password if provided.
            bcrypt.genSalt(10, 'a', function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    var sql = "UPDATE user SET FIRST_NAME = ?, MI = ?, LAST_NAME = ?, USER_NAME = ?, EMAIL = ?, PHONE = ?, PASSWORD = ? WHERE PK_USER_ID = ?;";
                    req.connection.query(sql, [firstName, MI, lastName, username, email, phone, hash, userID], function (err, result) {
                        if (err) {
                            //log.error('SQL ERR: ' + err);
                            res.send('err');
                        } else {
                            // UPDATE the ROLE to cosa_Role table
                            if (role != null) {
                                var sql2 = "UPDATE cosa_role SET ROLE_NAME = ? WHERE FK_USER_ID = ?";
                                req.connection.query(sql2, [role, userID], function (err_2, result_2) {
                                    if (err_2) {
                                        //log.error('SQL ERR: ' + err_2);
                                        res.send('err_2');
                                    }
                                });
                            }

                            res.send(result.affectedRows + " record updated");

                        }
                    });
                });
            });
        } else { // updated everything but password.
            var sql = "UPDATE user SET FIRST_NAME = ?, MI = ?, LAST_NAME = ?, USER_NAME = ?, EMAIL = ?, PHONE = ? WHERE PK_USER_ID = ?;";
            req.connection.query(sql, [firstName, MI, lastName, username, email, phone, userID], function (err, result) {
                if (err) {
                    //log.error('SQL ERR: ' + err);
                    res.send('err');
                } else {
                    // UPDATE the ROLE to cosa_Role table
                    if (role != null) {
                        var sql2 = "UPDATE cosa_role SET ROLE_NAME = ? WHERE FK_USER_ID = ?";
                        req.connection.query(sql2, [role, userID], function (err_2, result_2) {
                            if (err_2) {
                                //log.error('SQL ERR: ' + err_2);
                                res.send('err_2');
                            }
                        });
                    }

                    res.send(result.affectedRows + " record updated");

                }
            });
        }
    });

    /* Delete a user account. Admins only capability */
    router.post('/deleteUser', userRestrict.siteAdminRestrictWCode, function (req, res) {

        var userID = req.body.userID;

        var sql = "DELETE FROM user WHERE PK_USER_ID = ?";
        req.connection.query(sql, [userID], function (err, result) {
            if (err) {
                // log.error("SQL Error: " + err);
            } else {
                //log.info("User deleated");
                res.send(result.affectedRows + " record deleted");
            }
        });
    });

    router.post('/login', (passport.authenticate('local', {
        successRedirect: "/auth/profile",
        failureRedirect: '/'
    })));

    router.get('/logout', userRestrict.restrict, function (req, res) {
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });

    router.get('/profile', userRestrict.restrict, function (req, res) {

        //if ((req.session.passport ? true : false)) console.log("req.session.passport exists");

        //console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
        //console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport.user)}`);
        //console.log(`req.session.passport.user.role: ${JSON.stringify(req.session.passport.user.role)}`);
        //console.log(`req.user: ${JSON.stringify(req.user)}`);

        res.redirect('/');

    });

    return router;

}

module.exports = appRouter;
