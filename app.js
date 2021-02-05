var express = require('express');
var path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
var User = require('./models/user');
const passport = require('passport');
var nconf = require('nconf');



if (process.env.NODE_ENV !== 'production') {
    nconf.env()
    nconf.file('config.json');
    var db_name = nconf.get('MONGO_DB_DEV');
    var memberPass = nconf.get('memberpass');
} else {
    nconf.env();
    nconf.file('configprod.json');
    var db_name = nconf.get('MONGO_DB_PROD');
    var memberPass = nconf.get('memberpass');
}
var routes = require('./routes/index')(passport, memberPass);

var users = require('./routes/users');


var mongoDB = process.env.MONGODB_URI || db_name;
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            };
            if (!user) {
                return done(null, false, { msg: "Incorrect username" });
            } else {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    return done(null, user)
                } else {
                    return done(null, false, {msg: "Incorrect password"})
                }
            })
        }
         })
        })
    );
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(session({secret: "kitties", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
