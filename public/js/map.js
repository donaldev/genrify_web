var citiesSearched = [];
var cities = cityDetails;
var countriesLayer;


var style = new ol.style.Style({
  fill: new ol.style.Fill({
          color: [203, 194, 185, 1]
        }),
  stroke: new ol.style.Stroke({
          color: [101, 95, 90, 1],
          width: 1,
        })
});


//VECTOR SOURCES - MARKERS AND HEAT
var markerSource = new ol.source.Vector({

}),
    heatSource = new ol.source.Vector({
});

//CONVERTS LAT/LONG TO DEFAULT PROJ FOR MAP
var toDefaultProjection = (lat, long) => {
    return ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
}
//FEATURE STYLES
var iconStyle = new ol.style.Style({
      image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        opacity: 0.65,
        scale: 0.15,
        src: '../img/marker.png'
      }))
    });

//ADDS MARKERS TO MAP
for(var pos = 0; pos < cities.length; pos++) {

    var markerFeature = new ol.Feature({
        geometry: new  ol.geom.Point(toDefaultProjection(cities[pos].lat, cities[pos].long)),
        name: cities[pos].city,
        country: cities[pos].country,
        playlist: cities[pos].distinctive_music
    });
    //ADDS MARKER FEATURE TO MARKER SOURCE
    markerSource.addFeature(markerFeature);
}

/*var displayHotSpots = (listOfHeat) => {
    for(var i = 0; i < listOfHeat.length; i++) {
        var thisCity = _.find(cities, {city: listOfHeat[i].city});
        console.log(thisCity);
        var heatFeature = new ol.Feature({
            geometry: new ol.geom.Point(toDefaultProjection(thisCity.lat, thisCity.long)),
            name:  thisCity.city,
            country: thisCity.country,
            weight: 40
        });

        //ADDS HEAT FEATURE TO HEAT SOURCES
        heatSource.addFeature(heatFeature);


    }
    heatLayer.changed();
};*/


//TILED LAYER, MARKER LAYER, HEAT LAYER
var mapLayer = new ol.layer.Tile({
    source: new ol.source.OSM({
              wrapDateLine: false,
              wrapX: false,
              wrapY: false,
              noWrap: true
            })
    }),
    markerLayer = new ol.layer.Vector({
              source: markerSource,
              style: iconStyle
    }),
    tileLayer = new ol.layer.Tile({
                    source: new ol.source.OSM({
                      wrapDateLine: false,
                      wrapX: false,
                      noWrap: true
                    })
                }),
    heatLayer = new ol.layer.Heatmap({
    source: heatSource,
    radius: 10
    });

//POPUP OVERLAY
var popup = new ol.Overlay({
    position: 'bottom-right',
    element: document.getElementById('popup'),
    stopEvent: false,
    offset: [-10,-10],
});

var tooltip = new ol.Overlay({
  position: 'bottom-right',
  element: document.getElementById('tooltip'),
  stopEvent: false,
  offset: [-40, -15],
});

//DEFAULT MAP DISPLAYED
var map = new ol.Map({
    renderer: "canvas",
    view: new ol.View({
        //sets the center to Dublin
        center: ol.proj.transform([-6.2603, 53.3498], 'EPSG:4326', 'EPSG:3857'),
        zoom: 4,
        minZoom: 0,
        maxZoom: 12,
        projection : 'EPSG:900913'
    }),
    layers: [mapLayer, tileLayer, heatLayer, markerLayer],
    overlays: [popup, tooltip],
    target: "map",
});

//adds borders to countries where track is available
var generatePolygons = (data) => {
    var countries = data,
      layersCount = map.getLayers().getArray().length;

    if(data === null) {
      return;
    }

    if(layersCount === 5) {
      map.removeLayer(countriesLayer);
    }

    countriesLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON({
        defaultDataProjection :'EPSG:4326',
        projection: 'EPSG:3857'
      }),
      url: 'http://localhost:8888/js/mock/countries.geojson'
    }),
    style: (feature, res) => {
      for(var i = 0; i < countries.length; i++){
        if(feature.f === countries[i]) {
          document.querySelector("#map-view").scrollIntoView({
            block: "start",
            behavior: "smooth"
          });
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
            color: '#81DA87',
              width: 2
            })
          });
        }
      }
    } //end of countriesLayer

  });
  map.addLayer(countriesLayer);
}

var cityPopover = (element, feature, e) => {
  if (feature) {

    //GETS COORDINATES AND SETS POSITION OF POPUP
    popup.setPosition(feature.getGeometry().getCoordinates());

    //SETS CONTENTS FOR POPUP
    var popupInfo = `<h5>${feature.get('name')}</h5>`;
    popupInfo+= `<p>${feature.get('country')}</p>`;
    popupInfo+= `<button class="btn-city" onclick="fetchTracks('${feature.get('playlist')}', '${feature.get('name')}', '${feature.get('country')}')">Get Playlist</button>`;
    $(element).attr('data-placement', 'right');
    $(element).attr('data-html', true);
    $(element).attr('data-content', popupInfo);


    $(element).popover("show");
  } else {
    $(element).popover('destroy');
  }
};

//map.getViewport().style.cursor = "-webkit-grab";
map.on('pointerdrag', (e) => {
    map.getViewport().style.cursor = "-webkit-grab";
    $("#tooltip").popover("hide");
    $("#popup").popover('destroy');
});

map.on('pointermove', (evt) => {
  if(evt.dragging) {
    $(element).popover("destroy");
  }
  var element = document.getElementById('tooltip'),
      feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {

        if(layer == markerLayer) {
          tooltip.setPosition(feature.getGeometry().getCoordinates());

          //SETS CONTENTS FOR POPUP
          var tooltipInfo = `<h5>${feature.get('name')}</h5>`;
          tooltipInfo+= `<p>${feature.get('country')}</p>`;
          $(element).attr('data-placement', 'right');
          $(element).attr('data-html', true);
          $(element).attr('data-content', tooltipInfo);
          $(element).popover("show");
          return feature;
        } else {
          return;
        }
      });
});

map.on('click', (evt) => {
  var element = document.getElementById('popup'),
      feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if(layer == markerLayer) {
          cityPopover(element, feature, evt);
          return feature;
        } else {
          return;
        }
      });
});

//GEOCODER FOR MAP SEARCHING
var geocoder = new Geocoder("nominatim", {
    provider: "osm",
    lang: "en",
    placeholder: "Find...",
    limit: 10,
    debug: true,
    autoComplete: true,
    keepOpen: false
});

geocoder.on('addresschosen', (evt) => {
    citiesSearched.push(evt);
});

window.onresize = () => { setTimeout(() => { map.updateSize();}, 200);}

//adds the search bar to the map for searching cities
map.addControl(geocoder);
