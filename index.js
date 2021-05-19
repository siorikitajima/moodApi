var cron = require('node-cron');
var express = require('express');
var cors = require('cors');
var app = express();
var http = require('http');
var server = http.createServer(app);
var mongo = require('mongodb');
var Twit = require('twit'); 
var MongoClient = require('mongodb').MongoClient;
var keys = require('./keys');
var routes = require('./routes/api');

server.listen(process.env.PORT || 3000, function() {
  console.log("Omar listning...");
});
app.use(cors());
app.use('/api', routes);

// Twitter Query
var querHate = ['lang:en hate -love -happy -sex -enjoy -warmth -sweet -lovely -happiness AND -filter:links AND -filter:media AND -filter:mentions AND -filter:retweet AND -filter:replies'];
var querLove = ['lang:en love -hate -kill -die -murder -sex -disgusting -hatred -murder AND -filter:links AND -filter:media AND -filter:mentions AND -filter:retweet AND -filter:replies'];


// Twitter API credentials  
var T = new Twit(keys.twit);
var url = keys.mongoCloud;

var numOfTweets = 100;
var maxIDHate;
var maxIDLove;

async function getHateRequest() {
  var hateContainer = [];
    await T.get('search/tweets', { 
        q: querHate, 
        count: numOfTweets,
        since_id: maxIDHate > 0 ? maxIDHate : null
     }, (err, data, response)  => {
      maxIDHate = data.search_metadata.max_id;
        for( var i = 0; i < data.statuses.length; i++) {
            var tweetDate = data.statuses[i].created_at;
            var tweetID = data.statuses[i].id;
            var tweetText = data.statuses[i].text;
            var tweetUser = data.statuses[i].user.screen_name;
            var hatetweet = { 
                tweet_id: tweetID, 
                tweet: tweetText, 
                twitter_handle: tweetUser, 
                created_at: tweetDate,
               };
               hateContainer.push(hatetweet);
      }
      var hateMood = {
        timeStamp: new Date(),
        numberHate: hateContainer.length,
        tweet_id: hateContainer[0].tweet_id,
        tweet: hateContainer[0].tweet, 
        twitter_handle: hateContainer[0].twitter_handle, 
        created_at: hateContainer[0].created_at
      };
      MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("182");
        dbo.collection("hateMood").insertOne(hateMood, function(err, res) {
          if (err) throw err;
          db.close();
        });
        });
      console.log('Hate: ' + hateMood.numberHate + ' at ' + (new Date()));
    });
  };

async function getLoveRequest() {
  var loveContainer = [];
    await T.get('search/tweets', { 
      q: querLove, 
      count: numOfTweets,
      since_id: maxIDLove > 0 ? maxIDLove : null
   }, (err, data, response)  => {
    maxIDLove = data.search_metadata.max_id;
      for( var i = 0; i < data.statuses.length; i++) {
          var tweetDate = data.statuses[i].created_at;
          var tweetID = data.statuses[i].id;
          var tweetText = data.statuses[i].text;
          var tweetUser = data.statuses[i].user.screen_name;
          
          var lovetweet = { 
              tweet_id: tweetID, 
              tweet: tweetText, 
              twitter_handle: tweetUser, 
              created_at: tweetDate,
             };
             loveContainer.push(lovetweet);
    }
    var loveMood = {
      timeStamp: new Date(),
      numberLove: loveContainer.length,
      tweet_id: loveContainer[0].tweet_id,
      tweet: loveContainer[0].tweet, 
      twitter_handle: loveContainer[0].twitter_handle, 
      created_at: loveContainer[0].created_at
    };
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("182");
      dbo.collection("loveMood").insertOne(loveMood, function(err, res) {
        if (err) throw err;
        db.close();
      });
      });
    console.log('Love: ' + loveMood.numberLove + ' at ' + (new Date()));
  });
};

function dairySummary() {
  MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db("182");
    var loveMood = dbo.collection("loveMood");
    var hateMood = dbo.collection("hateMood");
    var totalMood = dbo.collection("totalMood");

    // ISO Date of 24 hours ago
    var theCurrentDate = new Date();
    var aDayBefore = new Date(theCurrentDate);
    aDayBefore.setHours(aDayBefore.getHours()-24);

    var query = { timeStamp: { '$gte' : aDayBefore }};
    var projection = { projection: { _id: 0, timeStamp: 0, tweet_id: 0, tweet: 0, twitter_handle: 0, created_at:0 }};

    var queryPromise = function(findQueryCursor) {
      return new Promise(function(resolve, reject) {
        findQueryCursor.toArray(function(err, data) {
          resolve(data);
        });
      });
    };

    promiseAr = [];
    promiseAr.push(
      queryPromise(
        loveMood.find(query, projection)
      )
    );
    promiseAr.push(
      queryPromise(
        hateMood.find(query, projection)
      )
    );

    Promise.all(promiseAr)
    .then(function(dataArray) {
      var loveNumber = 0;
      var hateNumber = 0;
      for(var i = 0; i < dataArray[0].length; i++) {
        loveNumber += dataArray[0][i].numberLove;
      }
      for(var h = 0; h < dataArray[1].length; h++) {
        hateNumber += dataArray[1][h].numberHate;
      }
      var dailyMood = {
        timeStamp: new Date(),
        dailyLove: loveNumber,
        dailyHate: hateNumber
      };
      totalMood.insertOne(dailyMood, function() {
        db.close();
      });
      console.log(dailyMood);
      var deleteQuery = { timeStamp: { '$lte' : aDayBefore }};
      loveMood.deleteMany(deleteQuery);
      hateMood.deleteMany(deleteQuery);
    })
    .catch(function(err) {
      console.error(err);
    });
  });
};

// 10 sec routine
var twitterTask = cron.schedule('0,15,30,45 * * * * *', () => {
  getHateRequest();
  getLoveRequest();
});

// 24 hours routine
var summaryTask = cron.schedule('34 1 * * *', () => {
  dairySummary();
});

twitterTask.start();
summaryTask.start();