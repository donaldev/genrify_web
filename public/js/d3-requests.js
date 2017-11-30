var breakDownYears = (d, trackCount) => {

  var listOfSongs = d.preview,
      artists = [],
      artistBreakDown = `<h5>${d.text} IN REVIEW</h5>
                        <p>MAKES UP <span id="track-data">${Math.floor((d.preview.length / trackCount)*100)}%</span> OF THE PLAYLIST`;

  _.forEach(listOfSongs, (track) => {
      artists.push(track.artist);
  });

  artists = _.uniq(artists);

  _.forEach(artists, (artist) => {
    artistBreakDown += `<div class='track-breakdown' onclick='findEvents(${JSON.stringify(artist)})'>${artist}</div>`;
  });

  document.getElementById("info-breakdown").innerHTML = artistBreakDown;
};

var pauseMusic = () => {
  var track = document.getElementsByTagName('audio')[0];
  track.pause();
  $("#pause-icon").hide();
  $("#control-icon").append(`<img id="play-icon" onclick="playMusic()" src="../img/play-icon.svg">`);
};

var playMusic = () => {
  var track = document.getElementsByTagName('audio')[0];
  track.play();
  $("#control-icon").empty();
  $("#pause-icon").show();
};

var saveTrack = (trackId) => {
  document.getElementById("save-icon").innerHTML = '<img src="../img/saved.svg">';
  $.ajax({
    url:`https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
    headers: {
        Authorization: "Bearer " + ACCESS_TOKEN
    },
    type: "PUT",
    success: (res) => {
      alert("Successfully saved to your Spotify");
    },
    error: (xhr, status, error) => {
      var err = eval("(" + xhr.responseText + ")");
      alert("Whoops, there was an issue saving the track");
    }
  });
};
