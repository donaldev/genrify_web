function generateCloud(dataset) {
  $("#sub-genres").hide();
  $("#enableZoom").hide();
  d3.select("#city-genres").select("#zoom").remove();

    var color = d3.scaleOrdinal([d3.rgb('#FFF500'), d3.rgb('#FF6A87'), d3.rgb('#70BAFE'), d3.rgb('#73FFB9'), d3.rgb('#FFAD7B'), d3.rgb('#F3F3F3'), d3.rgb('#DAB0FF')]);

    var zoom_container = d3.select("#city-genres")
                           .append("div")
                           .attr("id", "zoom");

                        d3.cloud()
                         .size([1000, 750])
                         .words(dataset)
                         .rotate(function(d) { return ~~(Math.random()*2)*90; })
                         .fontSize(function(d) { return (1/d.text.length)*200; })
                         .text((d)=>{return d.text;})
                         .padding(function(d){
                           if(d.length < 5) {
                             return 25;
                           } else {
                             return 15;
                           }
                         })
                         .on("end", draw)
                         .start();


      function draw(words) {

        var svg = zoom_container.append("div")
                    .attr("class", "small")
                    .attr("align", "center")
                    .append("svg")
                    .attr("id", "word-cloud")
                    .attr("viewbox", "0 0 900 900")
                    .attr("height", 900)
                    .attr("width", 900)
                    .append("g")
                    .attr("transform", "translate(450,400)");

                    zoom_container.append("div")
                                  .attr("class", "large");


        var text =  svg.selectAll("text")
                    .data(words)
                    .enter()
                    .append("text")
                    .style("font-size", (d) => { return d.size + "px"; })
                    .style("fill", function(d, i) { return color(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
                    .text(function(d) { return d.text; })
                    .classed("svg-content-responsive", true);

        d3.selectAll("text").style("cursor", "pointer");

        text.on("click", (d) => {
          $("#city-genres").hide();
          var initialGenre = d.text;
          var arrOfGenres = d.text.split(" ");
          var subGenres = [];

          arrOfGenres.forEach(function(genre){
            dataset.forEach(function(val) {
              if(val.text.includes(genre) && subGenres.indexOf(val) == -1) {
                subGenres.push(val);
              }
            });
          });
          generateDonut(subGenres);
        });

        $("#zoom").anythingZoomer({
                edit: true,
                clone: true,
                initialized: (e, zoomer) => {
                  zoomer.$large.find('svg').attr({
                    width: 50,
                    height: 50
                  });
                },
              });

      }
}

function disableZoomer() {
  $(".az-overly").hide();
  $('#zoom').anythingZoomer('disable');
  $("#enableZoom").show();
  $("#disableZoom").hide();
}

function enableZoomer() {
  $(".az-overly").show();
  $('#zoom').anythingZoomer('enable');
  $("#enableZoom").hide();
  $("#disableZoom").show();
}
