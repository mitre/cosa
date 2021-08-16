var passport = require('passport');
require ('./strategies/local.strategy.js')();

module.exports = function passportConfig(app) {

    app.use(passport.initialize());
    app.use(passport.session());

    // Store user in session.
    passport.serializeUser((user, done) => {

        // done(err, object)
        done(null, user);

    });

    // Get user from session.
    passport.deserializeUser((user, done) => {

        // done(err, object)
        done(null, user);

    });

}