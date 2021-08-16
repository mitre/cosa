var passport = require('passport');
var bcrypt = require('bcryptjs');
var { Strategy } = require('passport-local');

module.exports = function localStrategy() {

    passport.use(new Strategy(

        {

            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true

        }, (req, username, password, done) => {

            var sql = "SELECT PK_USER_ID, USER_NAME, PASSWORD, FIRST_NAME, MI, LAST_NAME, cosa_role.ROLE_NAME, PHONE, EMAIL, LAST_LOGIN_DATE FROM user INNER JOIN cosa_role ON user.PK_USER_ID = cosa_role.FK_USER_ID WHERE USER_NAME = ? limit 0,1;";

            var params = [username]

            req.connection.query(sql, params, function (err, info) {

                if (err) {

                    log.error("SQL Login Error: " + err);

                    done(null, false);

                } else {


                    var timestamp = new Date()

                    if (info.length == 1) {
                        bcrypt.compare(password, info[0].PASSWORD, function (err, valid) {
                            if (valid) {

                                var userInfo = info[0];

                                var id = userInfo.PK_USER_ID;
                                var name = userInfo.USER_NAME;
                                var firstname = userInfo.FIRST_NAME;
                                var mi = userInfo.MI;
                                var lastname = userInfo.LAST_NAME;
                                var role = userInfo.ROLE_NAME;
                                var phone = userInfo.PHONE;
                                var email = userInfo.EMAIL;


                                req.connection.query("UPDATE `user` SET `LAST_LOGIN_DATE` = now() WHERE `PK_USER_ID` = ?", userInfo.PK_USER_ID, function (err, result) { });
                                console.log("LOGIN SUCCESS (" + timestamp + ") - Username: " + username)

                                const user = { username, id, name, firstname, mi, lastname, role, phone, email };

                                done(null, user);
                            } else {
                                console.log("LOGIN FAILURE (" + timestamp + ") - Username: " + username)
                                done(null, false);
                            }
                        });

                    } else {

                        console.log("LOGIN FAILURE (" + timestamp + ") - Username: " + username);
                        done(null, false);

                    }
                }
            });
        }));
}
