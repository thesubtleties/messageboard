module.exports = function(passport, memberPass) {
var express = require('express');
var router = express.Router(); 
var User = require('../models/user');
var Post = require('../models/post');
var async = require('async');
var {body, validationResult} = require('express-validator');
var bcrypt = require('bcryptjs');

/* GET Index */
router.get('/', function(req, res, next) {
  if (req.user) {
    async.parallel({
      posts: function(callback) {
        Post.find().sort({ datePosted: 'descending' }).populate('postedBy').exec(callback);
      },
      user: function(callback) {
        User.findById(req.user.id).exec(callback);
      }
    }, function (err, results) {
      if (err) { return next(err); }
      res.render('home', { title: 'Welcome', posts: results.posts })
    })
  } else {
    res.render('index', { title: 'Log in' });
  }
  
});

router.post('/postmessage', [
  body('newpost', '240 characters max.').trim().isLength({ min: 1, max: 240 }).escape(),
  (req, res, next) => {
    if (req.user) {
    const errors = validationResult(req);
    const post = new Post({
      postedBy: req.user._id,
      datePosted: new Date(),
      body: req.body.newpost,
    });
    if (!errors.isEmpty()) {
      Post.find().exec((err, posts) => {
        if (err) { return  next(err); }
        res.render('home', { title: 'Welcome', posts: posts, errors: errors.array() })
        return;
      })
    } else {
      post.save(function(err) {
        if (err) {
          Post.find().exec((error, posts) => {
            if (error) { return next(err); }
            res.render('home', { title: 'Welcome', posts: posts, error: err.message })
          })
        } else {
          res.redirect('/');
        }
      })
    }
  }}
]);

router.post('/deletemessage', [
  body('postid', 'Not a valid post').escape(),
  (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.redirect('/')
      return;
    }
    if (req.user.isAdmin === true) {
      Post.findByIdAndRemove(req.body.postid, function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      })
    }
  }
])



router.post('/sign-in', [
    body('username').trim().escape(),
    body('password').trim().escape(),
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/'
  })
]
)

router.get('/sign-up', function(req, res, next) {
  res.render('signup', { title: 'Sign Up' });
})

router.post('/sign-up', [
  // new user - make sure to sanitize. make sure no duplicate username.
  body('username', 'Username must not be blank.').trim().isLength({ min: 1 }).escape(),
  body('password', 'Password must be at least six characters.').trim().isLength({ min: 6 }).escape(),
  (req, res, next) => {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      const errors = validationResult(req);
      var user = new User({
        username: req.body.username,
        password: hashedPassword,
        joinDate: new Date()
      })
      if (!errors.isEmpty()) {
        res.render('signup', { errors: errors.array() });
        return
      } else {
        user.save(function(err) {
          if (err) { 
            var ourError= err.message;
            if (err.message = "User validation failed: username: Username is already taken.") {
              ourError = "Username is already taken."
            }
            res.render('signup', { dbError: ourError })
          return }
          res.redirect('/');
        })
      }
    })
  }

])

router.get('/membership', function(req, res, next) {
  if (req.user) {
    if (req.user.member === false) {
  res.render('membership', { title: 'Member Access' });
    } else { 
      res.render('ismember', { title: 'You are in the club.'});
    }
  } else {
    res.redirect('/');
  }
})

router.post('/membership', [
  body('password').trim().escape(),

  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('/membership', { title: 'Member Access', errors: errors });
      return;
    }
    if (req.body.memberPass === memberPass || req.body.memberPass === process.env.MEMBER_PASS) {
      const user = new User({
        member: true,
        _id: req.user._id
      });
      User.findByIdAndUpdate(req.user._id, user, {}, function(err, ourUser) {
        if (err) { return next(err); }
        res.redirect('/');
      }
      )
  } else {
    res.render('membership', { title: 'Member Access', errors: 'Incorrect password.' });
  }
}
])
router.get('/log-out', function(req, res, next) {
  req.logout();
  res.redirect('/');
})
return router;
}


