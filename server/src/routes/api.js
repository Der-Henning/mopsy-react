const router  = require('express').Router();
const config  = require('../config');
const request = require('request');
const url     = require('url');
const models  = require('../models');
const jwt     = require('jsonwebtoken');
const auth    = require('../middleware/auth');

// build solr url for SOLR backend requests
const solr = url.format({
  protocol: 'http',
  hostname: config.solr_host,
  port: config.solr_port,
  pathname: 'solr/' + config.solr_core,
});

// welcome page 
// TODO: -> API documentation
router.get('/', (req, res, next) => {
  res.send('Welcome to MOPS-Y API!').status(200);
});

// create new token, send as x-auth-token in header
// token must be provided via x-access-token or authorization in header in every request
router.post('/newtoken', (req, res, next) => {
  models.User.create().then((user) => {
    const token = jwt.sign({ UserId: user.id}, config.myprivatekey);
    res.header("x-auth-token", token).send();
  });
});

// search 
router.post('/search', auth, async (req, res, next) => {
  var q = req.body.q || '*';
  var start = req.body.start || 0;
  var fq = [];
  if(req.body.fq) fq = [].concat(req.body.fq);
  if(req.LoginId && req.body.onlyFavs) {
    await models.Favorite.findAll({
      where: {
        LoginId: req.LoginId
      },
      attributes: ['DocId'],
      raw: true
    }).then((response) => {
      if (response.length > 0) {
        var favorites = response.map(fav => fav.DocId);
        fq = fq.concat('id:(' + favorites.join(' OR ') + ')');
      }
    });
  }

  request.post(
    {
      url: solr + '/search',
      body: {
        params: {
          q: q,
          start: start,
          fq: fq,
          'hl.snippets': 10
        }
      },
      json:true
    },
    (err,httpResponse,body) => {
      if(err) {
        res.status(500).send();
      } else {
        if(body.responseHeader.status == 0) {
          res.status(200).send(body);
          next();
        } else {
          res.status(body.responseHeader.status).send("SOLR backend error");
        }
      }
    }
  );
});

// post /search process to save search log
router.use('/search', (req, res, next) => {
  if (req.body.q) {
    models.Log.create({
      query: req.body.q,
      remoteAddress: req.ip,
      UserId: req.UserId
    });
    next();
  }
});

// post /search process to save and increment query and count
router.use('/search', (req, res, next) => {
  if (req.body.q) {
    var terms = req.body.q.split(" ");
    for (let term of terms) {
      models.Query.findOrCreate({where: {query: term}, defaults: {}})
      .then(([query, created]) => {
        query.increment('counter', {by: 1});
      });
    }
  }
});

// get search suggestions
router.post('/suggest', auth, (req, res, next) => {
  const { q } = req.body;
  if (q) {
    request.post(
      {
        url: solr + '/suggest',
        body: {
          params: {
            q: q
          }
        },
        json:true
      },
      (err,httpResponse,body) => {
        if(err) {
          res.status(500).send("SOLR backend connection error");
        } else {
          if(body.responseHeader.status == 0) {
            res.send(body.suggest.mySuggester[q].suggestions.map(t => t.term));
          } else {
            res.status(body.responseHeader.status).send("SOLR backend error");
          }
        }
      }
    );
  } else {
    res.status(400).send("missing input");
  }
});

// set favorite for loged in user
router.post('/setfavorite', auth, (req, res, next) => {
  const { DocId } = req.body;
  if (DocId && req.LoginId) {
    request.post({
      url: solr + '/select',
      body: {
        params: {
          q: 'id:' + DocId
        }
      },
      json: true
    }, (err, httpResponse, body) => {
      if (err) res.status(500).send("Error with SOLR backend communication");
      if (body.responseHeader.status == 0) {
        if (body.response.numFound > 0) {
          models.Favorite.create({
            DocId: DocId,
            LoginId: req.LoginId
          }).then(() => {
            res.status(200).send();
          }).catch(error => {
            res.status(400).send("Favorite already set");
          });
        } else {
          res.status(400).send("Document doesn't exist");
        }
      } else res.status(body.responseHeader.status).send();
    });

  } else res.status(400).send("Missing parameters");
})

// get favorites of loged in user
router.post('/getfavorites', auth, (req, res, next) => {
  if (req.LoginId) {
    models.Favorite.findAll({
      where: {
        LoginId: req.LoginId
      }
    }).then(favorites => {
      res.status(200).send(favorites.map(fav => fav.DocId));
    });
  } else res.status(400).send("Login required");
});

// proxy /select request to SOLR backend
router.post('/select', auth, (req, res, next) => {
  request.post({
    url: solr + '/select',
    body: {
      params: req.body
    },
    json: true
  }, (err, httpResponse, body) => {
    if (err) return res.status(httpResponse).send(err);
    res.status(200).send(body);
  });
});

// get data for specific document
router.post('/select/:DocId', auth, (req, res, next) => {
  const { DocId } = req.params;
  request.post({
    url: solr + '/select',
    body: {
      params: {q: 'id:' + DocId}
    },
    json: true
  }, (err, httpResponse, body) => {
    if (err) return res.status(httpResponse).send(err);
    if (body.response.numFound < 1) return res.status(400).send("document doesn't exist");
    res.status(200).send(body.response.docs[0]);
  });
});

// get top queries, takes count as input, default 30
router.post('/tagcloud', auth, (req, res, next) => {
  const count = parseInt(req.body.count, 10) || 30;
  models.Query.findAll({
    limit: count,
    order: [['counter', 'DESC']],
    attributes: ['query', 'counter']
  }).then(queries => {
    res.status(200).send(queries);
  }).catch(error => {
    res.status(400).send();
  });
});

router.get('*', (req, res, next) => {
  res.redirect('/api');
});

module.exports = router;