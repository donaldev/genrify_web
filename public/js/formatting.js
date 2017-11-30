function getGreeting() {
  var dateNow = new Date(),
  hourNow = dateNow.getHours(),
  greeting = "";

  if(hourNow >= 0 && hourNow < 12) {
    greeting = "Good Morning";
  } else if(hourNow >= 12 && hourNow < 15) {
    greeting = "Good Afternoon";
  } else if(hourNow >= 15 && hourNow < 19) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }
  document.getElementById("greeting").innerHTML = greeting;
}

getGreeting();

// translates milliseconds to minutes for track duration
var millstoMinutes = (mills)  => {
    var mins = Math.floor(mills/ 60000);
    var secs = ((mills % 60000) / 1000).toFixed(0);
    secs = secs < 10 ? secs + "0" : secs + "";
    return mins + ":" + secs;
}

var audio = document.createElement("audio");

var playSong = (track_url) => {
  var bubbleAudio = document.getElementById("bubble-audio");
  if(track_url === null) {
    alert("Sorry, no preview available for this track");
  } else {
    audio.setAttribute("src", track_url);
    audio.setAttribute("id", "track_audio");
    if(audio.src === "http://musimap.herokuapp.com/null") {
      alert("Oh no, no preview available for this track. So sorry about that!");
    } else {
      if(bubbleAudio !== null && !bubbleAudio.paused) {
        bubbleAudio.pause();
      }
      $(this).attr("src", "../img/pause-icon.svg");
      document.getElementsByClassName("city-genres")[0].appendChild(audio);
      audio.play();
    }
  }
}

var compilePlaylist = (playlist) => {

  var tbody = "";
  $('.table').dataTable().fnDestroy();

  _.forEach(playlist, (song) => {
    //<img class="artist-pic" src="${song.track.album.images[0].url}">
    tbody += `<tr><td>
              <h5><span id="track-ctrl"><img class="play-btn" onclick="playSong('${song.track_preview}')" src="../img/play-icon.svg"></span>${song.track}</h5><br/>
              <p class="album-name">Album: ${song.album}</p></td>`;
    tbody += `<td><h5>${song.name}</h5></td>`;
    tbody += `<td><h5>${millstoMinutes(song.duration)}</h5></td></tr>`;
  });

  $("tbody").empty().append(tbody);
  $('.table').DataTable({
        order: [],
        columnDefs: [
            { "width": "300px", "targets": [0] }
        ],
        rowReorder: {
            selector: 'td:nth-child(2)'
        },
        pageLength: 5,
        responsive: true
  });
}

var displayData = (count, id, feature) => {
  $(".dash-overview .bubblingG").show();
  $(".overview").hide();
  var dataCount = count.length;
  feature = dataCount === 1 ? feature : `${feature}s`;
  $(".overview").show();
  $(`#${id}`).html(`<h5>${dataCount}</h5> different ${feature}`);
}

var addCarouselSlides = (data) => {
  //console.log(data);
  var slides = '<div class="owl-carousel owl-theme">';

  _.forEach(data, (artist) => {

    var tracks = '<ul class="tracks-list">';
    _.forEach(artist.tracks, (track)=> {
      tracks+= `<li onclick='generatePolygons(${JSON.stringify(track.markets)})'>${track.name}</li>`;
    });
    tracks+= "</ul>";

    slides += `<div class="item">
                <img class="slide-img" src="${artist.preview}">
                <h5>${artist.text}</h5>
                <p class="track-info"><i class="fa fa-music" aria-hidden="true"></i>${artist.count}</p>
                ${tracks}
               </div>`;
  });
  slides += "</div>";
  $("#carousel-slider").empty().append(slides);

  $('.owl-carousel').owlCarousel({
      loop:true,
      margin:50,
      nav:true,
      lazyLoad: true,
      responsiveClass:true,
      navText: ["<i class='fa fa-chevron-left'></i>","<i class='fa fa-chevron-right'></i>"],
      responsive:{
          0:{
              items:1
          },
          600:{
              items:3
          },
          1000:{
              items:3
          }
      }
  });

  $('.owl-carousel').on('initialized.owl.carousel', (e) => {
    idx = e.item.index;
    $('.owl-item.big').removeClass('big');
    $('.owl-item').eq(idx+1).addClass('big');
  });

  $('.owl-carousel').on('translate.owl.carousel', (e)=> {
        idx = e.item.index;
        $('.owl-item.big').removeClass('big');
        $('.owl-item').eq(idx+1).addClass('big');
    });
}

var showTracks = () => {
  $(this).hide();
}
