'use strict';
//VARIABLES
var releaseYear = {},
    genres = {},
    genresCount = [],
    ched = [],
    tracksWithGenres;

const ACCESS_TOKEN = getQueryStringValue("access_token");

function getQueryStringValue(key) {
    return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

/***************
API REQUESTS
****************/

//GETS EACH TRACK IN PLAYLIST
var fetchTracks = (playlist_id, city_name, country_code) => {
    var artistCount = [];
    var artistsIDs =[],
        trackCount = 0,
        albumIDs = [],
        artistsNames = {},
        playlist = playlist_id || "1n0W8NFV4OQBXCU9oZF4eX",
        city_name = city_name || "Dublin",
        country_code = country_code === undefined? "IE" : country_code.toUpperCase();


    $("#city-audio").empty();
    document.getElementById("city-name").innerHTML = `${city_name}, ${country_code}`;
    document.getElementById("cityName").innerHTML = `${city_name}`;
    $("#load").show();
    document.getElementById("page-content-wrapper").style.visibility="hidden";

    $.ajax({
    url: `https://api.spotify.com/v1/users/thesoundsofspotify/playlists/${playlist}/tracks`,
    headers: {
        Authorization: "Bearer " + ACCESS_TOKEN
    },
    accepts: "application/json",
    type: "GET",
    success: (res) => {
        trackCount = res.items.length;
        _.forEach(res.items, (song) => {
            //adds objects of albums along with the associated track's preview
            albumIDs.push({
              id: song.track.album.id,
              track: song.track.name,
              artist: song.track.artists[0].name,
              track_id: song.track.id,
              preview: song.track.preview_url
            });

            //creates an array of artist ids
            artistsIDs.push({
              id: song.track.artists[0].id,
              name: song.track.artists[0].name,
              album: song.track.album.name,
              track: song.track.name,
              track_id: song.track.id,
              track_preview: song.track.preview_url,
              track_market: song.track.available_markets,
              duration: song.track.duration_ms,
              uri: song.track.uri
            });

            //creates an object containing the number of times an artist appears
            if(!(artistsNames.hasOwnProperty(song.track.artists[0].name))) {
                artistsNames[song.track.artists[0].name] = {
                  tracks: [{"name" : song.track.name, "markets": song.track.available_markets}],
                  occurrence: 1,
                  preview_image: song.track.album.images[0].url
                };
            } else {
                artistsNames[song.track.artists[0].name].occurrence++;
                artistsNames[song.track.artists[0].name].tracks.push({"name" : song.track.name, "markets": song.track.available_markets});
            }

        });
        //end of for loop
    },
    complete: function(){
        $(".user-genres").show();
        $(".city-genres").hide();
        Object.keys(artistsNames).map((key, index) => {
           artistCount.push({
               "text" : key,
               "count" : artistsNames[key].occurrence,
               "preview" : artistsNames[key].preview_image,
               "tracks": artistsNames[key].tracks
             });
        });
        addCarouselSlides(artistCount);
        displayData(artistCount, "artist-overview", "artist");
        fetchGenres(artistsIDs, city_name);
        fetchRelease(albumIDs, trackCount);
        $('#load').hide();
        document.getElementById("page-content-wrapper").style.visibility="visible";
    },
    error: (xhr, status, error) => {
      var err = eval("(" + xhr.responseText + ")");
      if(err.error.status === 401) {
        alert(`Access token expired. Please click the refresh button near the top of the page.`);
      }
    }
  });
};

fetchTracks();

//GETS RELEASE YEAR OF EACH TRACK'S ALBUM
var fetchRelease = (albumIDs, trackCount) => {
    var albumSubArray = _.chunk(albumIDs, 20); //breaks the array into subarrays of length 20 or less
    releaseYear = {};
    var yearsCount = []; //resets the releaseYear object
    var count   = 0;

    //loops through the subarray and pushes the album id to an array
    for(var i = 0; i < albumSubArray.length; i++) {
        var albums = [];

        _.forEach(albumSubArray[i], (album) => {
            albums.push(album.id);
        });

        //joins the elements in the array into a string
        var albumsList = albums.join();

        $.ajax({
            url: `https://api.spotify.com/v1/albums/?ids=${albumsList}`,
            accepts: "application/json",
            type: "GET",
            success: (res) => {
              //loops through each album and increments the number of time each genre appears
              _.forEach(res.albums, (album) => {

                //finds the specific album object based on albumId and assigns it to previewObj
                var previewObj = _.find(albumIDs, {id: album.id});
                var albumRelease = album.release_date.substring(0,4);

                if(releaseYear.hasOwnProperty(albumRelease) == false) {
                  releaseYear[albumRelease] = {
                    occurrence: 1,
                    preview: [{
                      preview_url: previewObj.preview,
                      artist: previewObj.artist,
                      track: previewObj.track,
                      trackId: previewObj.track_id
                    }],
                  };
                } else {
                    releaseYear[albumRelease].occurrence++;
                    releaseYear[albumRelease].preview.push({
                      preview_url: previewObj.preview,
                      artist: previewObj.artist,
                      track: previewObj.track,
                      trackId: previewObj.track_id
                    });
                }

              });

            },
            complete: () => {
                  var data = {};
                  count++;
                  if(count === albumSubArray.length) {
                    Object.keys(releaseYear).map(function(key, index) {

                       // removes all null values from preview array
                       var previews = _.compact(releaseYear[key].preview);

                       yearsCount.push({"text" : key,
                                        "count" : releaseYear[key].occurrence,
                                        "preview": previews})
                    });

                    displayData(yearsCount, "year-overview", "year");
                    data.children = yearsCount;

                    //orders the data in decreasing order according to the count property
                    data.children = _.sortBy(data.children, "count").reverse();
                    generateBubbles(data, trackCount); //generates the bubble chart
                }
            }
        });
      }
};

//FETCH'S GENRE OF EACH TRACK'S ARTIST
var fetchGenres = (artistsIDs, city_name) => {
    var count       = 0,
        artistsSubArray = _.chunk(artistsIDs,50),
        genres = {},
        trackData = [],
        cityGenre = {};

        genresCount = [];
    for(var i = 0; i < artistsSubArray.length; i++) {
        var artists = [];

        _.forEach(artistsSubArray[i], (artist) => {
            artists.push(artist.id);
        });

        var artistList = artists.join();
            $.ajax({
                url: `https://api.spotify.com/v1/artists?ids=${artistList}`,
                accepts: "application/json",
                type: "GET",
                success: (res) => {
                  tracksWithGenres = [];

                  //loops through artists in array and associates a list of genre with each artist
                  _.forEach(res.artists, (artist) => {

                    //finds artist in array and associate genres with artist's track
                    let artistObj = _.find(artistsIDs, {id: artist.id});
                    artistObj["genres"] = artist.genres;
                    let index = artistsIDs.indexOf(artistObj);
                    artistsIDs.splice(index, 1);

                    trackData.push(artistObj);

                    _.forEach(artist.genres, (genre) => {
                      if(!(genres.hasOwnProperty(genre))) {
                          genres[genre] = 1;
                      } else {
                          genres[genre] += 1;
                      }
                    });
                  });
                  tracksWithGenres = trackData;
                },
                complete: () => {
                    count++;

                    if(count === artistsSubArray.length) {

                        Object.keys(genres).map((key, index) =>{
                           genresCount.push({"text" : key, "size" : genres[key]});
                        });

                        genresCount = _.sortBy(genresCount, "size").reverse();
                        cityGenre = {
                          city: city_name,
                          genres: genresCount
                        };
                        citiesSearched.push(cityGenre);
                    }
                    //displayHotSpots(citiesSearched);
                    compilePlaylist(trackData);
                    displayData(genresCount, "genre-overview", "genre");
                    generateCloud(genresCount);
                }
            });
    }
};

var postFeedback = (playistID, feedback) => {
  fetch("/giveFeedback", {
    method: "POST",
    body: JSON.stringify({"playlist": playistID, "feedback": feedback}),
    headers: new Headers({"Content-Type": "application/json"})
  });
};
