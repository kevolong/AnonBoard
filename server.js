'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const expect      = require('chai').expect;
const cors        = require('cors');
const helmet      = require('helmet');
const sassMiddleware = require('node-sass-middleware');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

//Use Node-Sass-Middleware to compile scss to css automatically
app.use(sassMiddleware({
    src: process.cwd() + '/scss',
    dest: process.cwd() + '/public',
    debug: true,
    outputStyle: 'nested'
}));

app.use(express.static('public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Use default Helmet security: dnsPrefetchControl, frameguard, hidePoweredBy, hsts, ieNoOpen, noSniff, xssFilter
app.use(helmet());
//Only send referrer header for pages from this app
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });


//Instructions page (static HTML)
app.route('/instructions')
  .get(function (req, res) {
    res.redirect('https://horn-celery.glitch.me/');
});

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/home.html');
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
if(!module.parent){ 
  app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port " + process.env.PORT);
    if(process.env.NODE_ENV==='test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          var error = e;
            console.log('Tests are not valid:');
            console.log(error);
        }
      }, 1500);
    }
  }); 
}

module.exports = app; //for testing
