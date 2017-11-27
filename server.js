// server.js
//     searchlog.{ where your node app starts

// init project
var mongo = require('mongodb').MongoClient
var https = require('https');
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.
var urlMongo = process.env.DBCONNSTR;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/api/imagesearch/:q", function (request, response) {
  mongo.connect(urlMongo, function(err,db){
    
    var searchlog = db.collection("searchlog");
    
    var offset = 1;
    if (request.query.offset){
      offset = parseInt(request.query.offset,10);
    }

    var searchUrl = "https://www.googleapis.com/customsearch/v1?key="+process.env.GAPIKEY+"&cx="+process.env.GSEARCHID+"&q="+request.params.q + "&searchType=image&start="+offset
    
    var logobj = {term: request.params.q, when: new Date()};
    
    searchlog.insertOne(logobj, function(err,result){
      if (err) throw err;
      
      https.get(searchUrl, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {

            var results = JSON.parse(data).items;
            var imgs = [];
            if (results) {
              results.forEach(function(result) {
                var img = {url: result.link, snippet: result.snippet, thumbnail: result.image.thumbnailLink, context: result.image.contextLink};
                imgs.push(img);
              });
            }
            response.status(200);
            response.json(imgs);
            response.end();
        });

      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
      db.close();
    });
  });
});

app.get("/api/lastest/imagesearch", function (request, response) {
  mongo.connect(urlMongo, function(err,db){
    var searchlog = db.collection("searchlog");
    searchlog.find({},{_id: 0}).toArray(function(err, docs) {
        if (err) throw err
        response.json(docs);
        response.end();
        db.close()
    });
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ', express().port);
});
