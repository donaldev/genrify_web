var filterGenres = (genre) => {
  $("#load-filtered").show();
  var spotifyId = document.getElementById("spotifyId").innerHTML,
      city      = document.getElementById("city-name").innerHTML,
      playlistId = "";

  var playlist = {
    "name": `Musimap, ${city} : ${genre}`,
    "public": false
  };

  var filteredPlaylist = [];
  _.forEach(tracksWithGenres, (track) => {
    var found = _.includes(track.genres, genre);
    if(found) {
      filteredPlaylist.push(track);
    }
  });
  compilePlaylist(filteredPlaylist);

  //creates a new playlist
  if(filteredPlaylist.length > 0) {
    $.ajax({
      url: `https://api.spotify.com/v1/users/${spotifyId}/playlists`,
      type: 'POST',
      data: JSON.stringify(playlist),
      dataType: 'json',
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN
      },
      contentType: 'application/json',
      success: (res) => {
        playlist_id = res.id;
        alert(`Successfully added ${city}-${genre} \n Let us know if you like it!`);
      },
      error: (xhr, status, error) => {
        var err = eval("(" + xhr.responseText + ")");
        alert(JSON.stringify(err));
      },
      complete: () => {
        addTracks(spotifyId, playlist_id, filteredPlaylist);
      }
    });
  } else {
    alert(`No tracks matching ${genre} to generate playlist. Why not try ${city}'s most popular genres?'`);
    compilePlaylist(tracksWithGenres);
    addCityGenres();
  }

  $("#load-filtered").hide();
}

function addCityGenres() {
  $(".user-genres").fadeOut(500);
  $(".city-genres").hide();
  var cityGenres = [],
      popularGenres = "<button class='btn-city' onclick='myGenres()'>View My Top Genres</button><br/>";
  if(genresCount.length > 10) {
    for(var i = 0; i < 10; i++) {
      cityGenres.push(genresCount[i].text);
    }
  } else {
    for(var i = 0; i < genresCount.length; i++) {
      cityGenres.push(genresCount[i].text);
    }
  }

  _.forEach(cityGenres, (gen)=>{
    popularGenres += `<p tabindex="0" onclick="filterGenres('${gen}')">${gen}</p>`;
  });
  $(".city-genres").empty().append(popularGenres).fadeIn(2000);
}

function addTracks(spotifyId, playlistId, newPlaylist) {
  var uri_list = [],
      uri_string = "";

  _.forEach(newPlaylist, (track) => {
    uri_list.push(track.uri);
  });

  uri_string = uri_list.join(",");
  $.ajax({
    type: 'POST',
    url: `https://api.spotify.com/v1/users/${spotifyId}/playlists/${playlistId}/tracks/?uris=${uri_string}`,
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer ' + ACCESS_TOKEN
    },
    contentType: 'application/json',
    success: (res) => {
      console.log("Added songs");
    },
    error: (xhr, status, error) => {
      var err = eval("(" + xhr.responseText + ")");
      alert(JSON.stringify(err));
    }
  });
}

function myGenres() {
  $(".user-genres").fadeIn(2000);
  $(".city-genres").fadeOut(500);
}
