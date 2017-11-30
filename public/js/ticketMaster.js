var findEvents = (artistName) => {
  $("#info-breakdown").hide("slow");
  var originalName = artistName;
  artistName = artistName.split(" ").join("%20");

  $.ajax({
    type: "GET",
    url: `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${JSON.stringify(artistName)}&apikey=pTiITdB1eDiqb0Pz5Ts1c3lBK1JoAWZb`,
    async: true,
    dataType: "json",
    success: (results) => {
      var resultsFound = false;
      var displayEvent = '';
      if(results.hasOwnProperty("_embedded")) {
        displayEvent+= "<h3>Upcoming Events</h3>";
        console.log(results._embedded.events);
        for(var i = 0; i < results._embedded.events.length; i++) {

          var event = results._embedded.events[i],
              venues = event._embedded.venues[0];

          if(results._embedded.events[i].name === originalName && venues.hasOwnProperty("address")) {
            resultsFound = true;
            var venue = event._embedded.venues[0].name === undefined ? venues.address.line1 : venues.name;

            displayEvent += `<div class="concert">
                            <h4>${event.name} - ${event.dates.start.localDate}, ${event.dates.start.localTime}</h4>`;
            displayEvent += `<div class="row">
                            <div class="col-lg-6 col-lg-offset-1 event-address">${venue}, ${venues.city.name}, <br/>${venues.country.name}</div>`;
            displayEvent += `<div class="col-lg-5"><a class="btn-ticket" target="_blank" href="${event.url}">VIEW TICKETS</a></div></div></div>`;
          }
        }
        if(resultsFound === false) {
          displayEvent+= `<h3>Unfortunately, no events are available for ${originalName}</h3>`;
        }
      } else {
        displayEvent = `<div><h3>Sorry, no current events available for ${originalName}.</div>`;
      }

      document.getElementById("concert-info").innerHTML = displayEvent;
      $("#concert-info").show();
    }
  });
};
