var generateDonut = (data) => {
        $("#sub-genres").show();
        var radius      = 200;

        //creates a palette of colours
        var palette = ['#519D9E', '#58C9B9', '#0DC066', '#6FD476', '#B8E986', '#1975E0', '#4990E2', '#70BAFE', '#9DD1FF', '#FF2D55', '#F94B63', '#FF8294', '#F8E81C', '#FFF465', '#FDF6A0', '#FF6000', '#FA792B', '#F6A623', '#F9B363'];
        var color       = d3.scaleOrdinal(palette);

        //targets canvas and appends an svg
        var canvas      = d3.select("#sub-genres")
            .append("svg")
            .attr("width", 500)
            .attr("height", 500);

        var group       = canvas.append("g")
                                .attr("transform", "translate(250,250)");
                                

            group.append("text")
               .attr("class", "genre-middle")
               .attr("text-anchor", "middle")
               .attr("font-size", "1.15em")
               .attr("fill", "#DADADA")
               .attr("font-weight", "800")
               .text("Hover me");

        //initialises the arc radius
        var arc         = d3.arc()
                            .innerRadius(100)
                            .outerRadius(radius);

        var pie         = d3.pie()
                            .value((d) =>{return d.size*3;});

        var arcs      = group.selectAll(".arc")
                              .data(pie(data))
                              .enter()
                              .append("g")
                              .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("z-index", "50")
            .attr("fill", (d, i) => {
                return color(i);
            });




        arcs.on("mouseover", (d) => {
            console.log(JSON.stringify(d));
            $(".genre-middle").remove();
          group.append("text")
             .attr("class", "genre-middle")
             .attr("text-anchor", "middle")
             .attr("font-size", "1.15em")
             .attr("fill", "#eee")
             .attr("font-weight", "800")
             .html(`${d.data.text}`);
        });

        //arcs.on("mouseout")
    }

var backToGenres = () => {
  d3.select("#sub-genres").select("svg").remove();
  $("#sub-genres").hide();
  $("#city-genres").show();
};
