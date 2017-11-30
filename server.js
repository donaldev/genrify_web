"use strict";

const express       = require("express"),
      mongoose      = require("mongoose"),
      User          = require("./models/user.js"),
      request       = require("request"),
      querystring   = require("querystring"),
      cookie_parser = require("cookie-parser"),
      bodyParser    = require("body-parser"),
      path          = require("path"),
      hbs           = require("hbs"),
      _             = require('lodash');;

      // mongodb://127.0.0.1:27017

let user_email = "",
    user_id = "";
const url = "mongodb://127.0.0.1:27017/genrify";
mongoose.Promise = global.Promise;
mongoose.connect(url);

const client_id = "a235ea71e65942a8bfcbe5e0116c426d",
    client_secret = "6389474ed30d4219afb6c5d616230c05",
    redirect_uri = "http://localhost:8888/callback",
    state_key = "spotify_auth_state",
    app = express();

    const port = process.env.PORT || 8888;


/*****
using handlebars view engine
******/
hbs.registerHelper('checkLength', (val) => {
  return val.length > 0;
});
hbs.registerHelper('json', (context) => {
    return JSON.stringify(context).replace(/"/g, '&quot;');
});
hbs.registerPartials(__dirname + "/views/partials");
app.set("view engine", "hbs");
app.use(bodyParser.json());

//generates a random string of a given length
var generateRandString = (length) => {
    var randString = "",
        randLength = 0,
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        randLength = Math.floor(Math.random() * alphabet.length);
        randString += alphabet.charAt(randLength);
    }
    return randString;
};

//Allows static pages to import libraries
app.use(express.static(path.join(__dirname, 'public'))).use(cookie_parser());
app.use(express.static(path.join(__dirname, 'node_modules')));


//on login, perform the following
app.get('/login', (req, res) => {
    var state = generateRandString(16),
        scope = "user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private user-library-modify playlist-read-private playlist-read-collaborative";
    res.cookie(state_key, state);

    //redirects to Spotify's services to authenticate the log in
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
            show_dialog: true
        }));

});


app.get('/callback', (req, res) => {
    var code = req.query.code || null,
        state = req.query.state || null,
        stored_state = req.cookies ? req.cookies[state_key] : null;

    if (state === null || state !== stored_state) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(state_key);

        //requests authorisation
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        //retrieves the response - access token and refresh token
        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                //params to request user data
                var options = {
                  url: 'https://api.spotify.com/v1/me',
                  headers: { 'Authorization': 'Bearer ' + access_token },
                  json: true
                };

                // get basic user data and save to db when any user logs in
                request.get(options, (error, response, body) => {
                  user_id = body.id;
                  user_email = body.email;
                  body.display_name = body.display_name === null ? "Buddy" : body.display_name;

                  //checks if it is an existing user
                  User.find({email: user_email}).count((err, doc)=>{
                    if(doc === 1 ){
                      //if user already has account in our db, update their current music information
                      getPlaylists(user_email, user_id);
                      getTopArtists(user_email);
                      getTopTracks(user_email);
                    } else {
                      //for new users, register them to our db
                      const user = new User({
                        name: body.display_name,
                        spotifyId: body.id,
                        email: body.email,
                        country: body.country
                      });

                      user.save()//saves user to db
                           .then(() => {
                            console.log("Saved user successfully")
                            console.log(user);
                      });
                      getPlaylists(user_email, user_id);
                      getTopArtists(user_email);
                      getTopTracks(user_email);
                    }
                  });
                });

                // retrieves all playlists associated with user's account
                var getPlaylists = (user_email, user_id) => {
                  var options = {
                    url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                  };

                  //makes a request for the playlists
                  request.get(options, (err, response, body) => {
                    var playlists = [];

                    //creates an array containing all the playlists which contains the playlist name, id and image
                    body.items.forEach(function(playlist){
                      if(playlist.name.includes("Musimap") && playlist.images !== undefined) {
                        playlists.push({
                          name: playlist.name,
                          id: playlist.id,
                          image: playlist.images[0].url
                        });
                      }
                    });

                    //saves playlist to mongodb
                    User.findOneAndUpdate({email: user_email}, {
                        $set: {
                          playlist: playlists
                        }
                      }, (err, doc)=> {
                        if(err) {
                          return console.log("Unable to update playlist", err);
                        }
                        console.log("Updated user's playlists", doc);
                    });
                  });
                };

                var getTopTracks = (user_email) => {
                  var options = {
                    url: 'https://api.spotify.com/v1/me/top/tracks?limit=50',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                  };

                  request.get(options, (err, response, body) => {
                    var tracks_names = [];
                    body.items.forEach(function(result){
                      tracks_names.push({
                        name: result.name,
                        id: result.id,
                        artist_name: result.artists[0].name,
                        artist_id: result.artists[0].id
                      });
                    });

                    User.findOneAndUpdate({email: user_email}, {
                        $set: {
                          tracks: tracks_names
                        }
                      }, (err, doc)=> {
                        if(err) {
                          return console.log("Unable to update tracks", err);
                        }
                        console.log("Updated user's tracks", doc);
                    });
                  });
                };

                function getTopArtists(user_email){
                  var opts = {
                      url: 'https://api.spotify.com/v1/me/top/artists?limit=50',
                      headers: {
                          'Authorization': 'Bearer ' + access_token
                      },
                      json: true
                  };

                  request.get(opts, (err, response, body) => {
                    var artists_names = [],
                        user_genres = [],
                        genreClusters = [],
                        temp_genres =[],
                        topGenres = [];

                    body.items.forEach(function(result){
                      artists_names.push({
                        name: result.name,
                        id: result.id,
                        genres: result.genres
                      });

                      for(var j = 0; j < result.genres.length; j++) {
                        user_genres.push(result.genres[j]);
                      }
                    });

                    user_genres.forEach(function(genre){
                      if(!(genreClusters.hasOwnProperty(genre))) {
                          genreClusters[genre] = 1;
                      } else {
                          genreClusters[genre] += 1;
                      }
                    });

                    Object.keys(genreClusters).map((key, index) =>{
                      temp_genres.push({"genre": key, "count": genreClusters[key]});
                    });

                    temp_genres = _.sortBy(temp_genres, "count").reverse();

                    if(temp_genres.length >= 10) {
                      for(var i = 0; i < 10; i++){
                        topGenres.push(temp_genres[i].genre);
                      }
                    } else if(temp_genres.length > 0 && temp_genres.length < 10) {
                      for(var i = 0; i < temp_genres.length; i++){
                        topGenres.push(temp_genres[i].genre);
                      }
                    } else {
                      console.log("No genres ready");
                    }

                    User.findOneAndUpdate({email: user_email}, {
                        $set: {
                          genres: user_genres,
                          top_genres: topGenres,
                          artists: artists_names
                        }
                      }, (err, doc)=> {
                        if(err) {
                          return console.log("Unable to update", err);
                        } else {
                        //if successful, redirect to the dashboard
                        res.redirect("/dashboard?" +
                            querystring.stringify({
                                access_token: access_token,
                                refresh_token: refresh_token
                            }));
                        console.log("Updated user", doc);
                      }
                      });
                  });
                };
            } else {
                res.redirect("/#" +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
      });
      //end of user data request
    }
});

app.get("/dashboard", (req, response) => {

  var user = "",
      artists = [];

  User.findOne({email: user_email}, (err, doc) => {
      user = doc;
      for(var i = 0; i < doc.artists.length; i++) {
        artists.push(doc.artists[i].name);
      }
      response.render("dash.hbs", {
        email: user.email,
        id: user.spotifyId,
        country: user.country,
        artists: user.artists,
        genres: user.top_genres,
        playlists: user.playlist
      });
  });

});

//log user out on clicking the log out button
app.get("/logout", (req, res)=> {
    res.redirect("https://www.spotify.com/logout/");
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  let retrievedURL = req.headers.referer;
  let refresh_token = retrievedURL.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent('refresh_token').replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1");

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      console.log(access_token);
      res.redirect("/dashboard?" +
          querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
          }));
    }
  });
});

app.post('/giveFeedback', function(req, res) {
  let result = res.json(req.body);
  console.log(result);
});
app.listen(port, () => {
    console.log(`Running server on: ${port}`);
});
