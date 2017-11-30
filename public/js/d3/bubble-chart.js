var generateBubbles = (data, trackCount) => {

  breakDownYears(data.children[0], trackCount);
  d3.select("#bubble-chart").select("svg").remove();
  $(".bubblingG").show();
  $("#info-breakdown").empty();
  $("#concert-info").empty();
  document.getElementById("bubble-chart").style.visibility="hidden";


  var width = 600,
      height = 500,
      diameter = 500,
      color = d3.scaleOrdinal([d3.rgb('#FFF500'), d3.rgb('#FF6A87'), d3.rgb('#70BAFE'), d3.rgb('#73FFB9'), d3.rgb('#FFAD7B'), d3.rgb('#F3F3F3'), d3.rgb('#DAB0FF')]);

  var svg = d3.select("#bubble-chart")
                 .append("svg")
                 .classed("svg-content-responsive", true)
                 .attr("width", width)
                 .attr("height", height)
                 .attr("class", "bubble img-fluid")
                 .style("margin-top", "-5px");

  var bubble = d3.pack()
                 .size([diameter, diameter])
                 .padding(5);

  var root = d3.hierarchy(data)
               .sum((d)=>{return d.count;});

  var node = svg.selectAll(".node")
                .data(bubble(root).children)
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", (d) => {return `translate(${d.x},${d.y})`;});

  node.append("circle")
      .attr("r", (d) => {return d.r})
      .style("fill", (d) => {return color(d.data.text);})
      .on("mouseover", paintMeCrimson)
      .on("mouseout", paintMeRed);

  node.append("text")
      .attr("dy", ".5em")
      .style("text-anchor", "middle")
      .style("font-size", "0.5em")
      .style("font-weight", "800")
      .style("fill", "black")
      .style("font-family", "Helvetica")
      .style("font-weight", "800")
      .text((d)=> {return `${d.data.text.substring(0, d.r/3)}`;});

  $(".bubblingG").hide();
  document.getElementById("bubble-chart").style.visibility="visible";

  node.on("mouseover", () => {
    return node.style("cursor", "pointer");
  });

  var audio = document.createElement('audio');

  node.on("click", (d) => {
    $("#bubble-instructions").hide();
    $("#info-breakdown").show("fast");
    $("#concert-info").hide("fast");
    breakDownYears(d.data, trackCount);

    var track_audio = document.getElementById("track_audio");

    if(d.data.preview.length === 1 && d.data.preview[0].preview_url === null) {
      alert("Sorry, no previews to play. Please click on another bubble.");
    } else {

      if((audio !== undefined)&&(!audio.paused)) {
        audio.pause();
      }

      if(track_audio !== null && !track_audio.paused) {
        track_audio.pause(); 
      }

      $("#play-icon").hide();
      var trackPlaying = randomiseTracks(d.data);
      var trackDetails =
      `<h5>Now Playing:</h5><p><img id="pause-icon" onclick="pauseMusic()" src="../img/pause-icon.svg"><span id="control-icon"></span>${trackPlaying.track} - ${trackPlaying.artist}<span id="save-icon">
      <img onclick="saveTrack('${trackPlaying.trackId}')" src="../img/save-icon.svg"></p>`;
      audio.setAttribute("src", trackPlaying.preview_url);
      audio.setAttribute("id", "bubble-audio");
      document.getElementById("city-audio").innerHTML = trackDetails;
      document.getElementById("city-audio").appendChild(audio);
      audio.play();
    }
  });

  function randomiseTracks(data) {
    var randomTrack = Math.floor(Math.random()*data.preview.length),
        trackPlaying = data.preview[randomTrack];

    if(trackPlaying.preview_url === null) {
      return randomiseTracks(data);
    } else {
      return trackPlaying;
    }
  }

  function paintMeCrimson(d) {
    d3.select(this)
      .style("fill", "pink")
      .style("scale", "1.2");
  };

  function paintMeRed(d) {
    d3.select(this)
      .style("fill", color(d.data.text));
  };

  d3.select(self.frameElement)
    .style("height", `${diameter}px`);


};
