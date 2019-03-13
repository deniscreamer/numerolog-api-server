const jsonServer = require('json-server');
const bodyParser = require('body-parser');
const cors = require('cors');

const nodemailer = require('nodemailer');
const Email = require('email-templates');

const fs = require('fs');

const path = require('path');
const router = jsonServer.router(path.join(__dirname, './json/db.json'));

const passport = require('passport'); // <1>
const Strategy = require('passport-http').BasicStrategy;

const middlewares = jsonServer.defaults();
const server = jsonServer.create();

var db = require('./db/index');
var urlsFromJson = Object.keys(
  JSON.parse(fs.readFileSync('./json/db.json', 'utf8'))
);

const urlsToAdmin = ['questions', 'orders'];
const urlsToAll = _removeFromArray(urlsToAdmin, urlsFromJson);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'XXX@gmail.com',
    pass: 'XXX',
  },
});
const email = new Email({
  message: {
    from: 'XXX@gmail.com',
  },
});
server.use(cors());
server.options('*', cors());
server.use(bodyParser.json()); // to support JSON-encoded bodies
server.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
createPassportStrategy();
AddRoutesWithRules(urlsToAll, needAccessToWrite);
AddRoutesWithRules(urlsToAdmin, needAccessToRead);
AddRoutesForSendEmail();
AddRoutesForQuestion();
server.use(middlewares);
server.use(router);
server.disable('x-powered-by');
server.listen(3000, () => {
  console.log('JSON Server is running on 3000');
});

function createPassportStrategy() {
  passport.use(
    new Strategy(function(username, password, cb) {
      db.users.findByUsername(username, function(err, user) {
        if (err) {
          return cb(err);
        }
        if (!user) {
          return cb(null, false);
        }
        if (user.password != password) {
          return cb(null, false);
        }
        return cb(null, user);
      });
    })
  );
}

function AddRoutesForSendEmail() {
  server.post('/sendorder/:id', function(req, res) {
    let mailOptions = {
      from: 'XXX@gmail.com',
      to: 'XXX@gmail.com',
      subject: `Form [${req.body.select}] [${req.body.fio}]`,
    };
    email
      .render('blank' + req.params.id + '/html', Object.assign({ locals: 'ru' }, req.body))
      .then(html => {
        mailOptions.html = html;
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            res.sendStatus(500);
          } else {
            res.json({ status: "ok" });
          }
        });
      })
      .catch(() => {
        res.sendStatus(500);
      });
  });
}

function AddRoutesForQuestion() {
  server.post('/sendquestion', function(req, res) {
    let mailOptions = {
      from: 'XXX@gmail.com',
      to: 'XXX@gmail.com',
      subject: `Question from website - [${req.body.username}]`,
    };
    email
      .render('contacts/html', Object.assign({ locals: 'ru' }, req.body))
      .then(html => {
        mailOptions.html = html;
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            res.sendStatus(500);
          } else {
            res.json({ status: "ok" });
          }
        });
      })
      .catch(() => {
        res.sendStatus(500);
      });
  });
}

function AddRoutesWithRules(allUrls, accessFunction) {
  allUrls.forEach(url => {
    server.use('/' + url, accessFunction);
  });
}

function needAccessToRead(req, res, next) {
  //res.end(req.method);
  if (req.method == 'GET') {
    passport.authenticate('basic', function(err, user, info) {
      return err ? next(err) : user ? next() : res.end('You Dont access');
    })(req, res, next);
  } else next();
}

function needAccessToWrite(req, res, next) {
  if ('POST/PUT/PATCH/DELETE'.split('/').includes(req.method)) {
    passport.authenticate('basic', function(err, user, info) {
      return err ? next(err) : user ? next() : res.end('You Dont access');
    })(req, res, next);
  } else if (req.method == 'GET') {
    next();
  }
}

function _removeFromArray(set, from) {
  return from.filter(function(e, i, a) {
    return set.indexOf(e) < 0;
  });
}
