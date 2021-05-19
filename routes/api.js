var express = require('express');
const router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var keys = require('../keys');
var url = keys.mongoCloud;

router.get('/', (req, res)=> {
    res.send('Welcome to the mood of the world back door. <a href="https://182.patternbased.com/mood-of-the-world/">This is the front door.</a>')
  });

router.get('/love', (req, res) => {
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        var dbo = db.db("182");
        var loveMood = dbo.collection("loveMood");
        loveMood.find().sort( { _id : -1 } ).limit(1)
        .toArray()
        .then(items => {
            console.log(`Love Twitter was viewed` + ' at ' + (new Date()));
            return items
        })
        .then((items) => {
            res.send(items);
            db.close();
        })
        .catch(err => {
            res.send(err);
            console.error(err);
        });
    });
});

router.get('/hate', (req, res) => {
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        var dbo = db.db("182");
        var hateMood = dbo.collection("hateMood");
        hateMood.find().sort( { _id : -1 } ).limit(1)
        .toArray()
        .then(items => {
            console.log(`Hate Twitter was viewed` + ' at ' + (new Date()));
            return items
        })
        .then((items) => {
            res.send(items);
            db.close();
        })
        .catch(err => {
            res.send(err);
            console.error(err);
        });
    });
});

router.get('/summary', (req, res) => {
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        var dbo = db.db("182");
        var totalMood = dbo.collection("totalMood");
        totalMood.find()
        .toArray()
        .then(items => {
            console.log(`The mood was viewed` + ' at ' + (new Date()))
            return items
        })
        .then((items) => {
            res.send(items);
            db.close();
        })
        .catch(err => {
            res.send(err);
            console.error(err);
        });
    });
});

module.exports = router;