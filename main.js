import './style.css';
import { Feature, Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { easeOut } from 'ol/easing.js';
import { Style } from 'ol/style.js';
import data from './data.json';
import GeoJSON from 'ol/format/GeoJSON.js';

import { EventHistory } from './event-history';
import { EventDetail } from './event-detail';
import { CustomStyles } from './style';
import { FLight } from './flight';

const airport = data.airport;

let currentPoint = airport;
let currentFeature;
let focusFeature;
let pointsArray = [];

const osmTileLayer = new TileLayer({
  source: new OSM(),
});
osmTileLayer.on('prerender', (e) => {
  if (e.context) {
    // enable dark mode filter
    const context = e.context;
    context.filter = 'grayscale(80%) invert(100%) ';
    context.globalCompositeOperation = 'source-over';
  }
});
osmTileLayer.on('postrender', (e) => {
  if (e.context) {
    // disable dark mode filter
    const context = e.context;
    context.filter = 'none';
  }
});

const pointsVectorLayer = new VectorLayer({
  source: new VectorSource({
    features: pointsArray,
  }),
  style: {
    'icon-src': '/flame.png',
    'icon-anchor': [0.5, 0.5],
    'icon-height': 26,
  },
});

const roadVectorLayer = new VectorLayer({
  source: new VectorSource({
    features: new GeoJSON().readFeatures(data.road_network),
  }),
  style: {
    'stroke-color': '#0B4F21',
    'stroke-width': 5,
  }
})

const airVectorLayer = new VectorLayer({
  source: new VectorSource(),
  style: {
    'icon-src': '/plane.png',
    'icon-anchor': [0.5, 0.5],
    'icon-height': 36,
    "icon-rotation": 1.55
  }
})

const view = new View({
  center: airport,
  zoom: 16,
  rotation: 1.17,
});

const map = new Map({
  target: 'map',
  layers: [
    osmTileLayer,
    roadVectorLayer,
    airVectorLayer,
    pointsVectorLayer,
  ],
  view: view,
});

const listEventHistory = new EventHistory("list-event-history");
const eventDetail = new EventDetail("card-event-info",
  _ => {
    panToLocation(currentFeature ? currentPoint : airport);
  },
  _ => {
    if (focusFeature) {
      pointsVectorLayer.getSource().removeFeature(focusFeature);
    }
    view.animate({
      center: airport,
      duration: 800,
      easing: easeOut,
      zoom: 16,
    });
  });
const popup = document.getElementById('popup');

// Listener function
function onEventHandled(dataString) {
  if (dataString === "Connected") {
    return;
  }
  const data = JSON.parse(dataString);
  // console.log('Event handled:', data);

  setTimeout(() => {
    if (currentFeature !== undefined) {
      pointsVectorLayer.getSource().removeFeature(currentFeature);
    }

    currentFeature = new Feature({
      geometry: new Point(data.location)
    });
    pointsVectorLayer.getSource().addFeature(currentFeature);

    // Append to hist list
    listEventHistory.addHistory(data.timestamp, data.incidentType, data.location, (evt) => {
      openDetailCard(data.incidentType, data.location);
    })
  }, data.incidentTTL);
}

function panToLocation(location) {
  if (focusFeature) {
    pointsVectorLayer.getSource().removeFeature(focusFeature);
  }
  currentPoint = location;
  focusFeature = new Feature({
    geometry: new Point(location),
  });
  focusFeature.setStyle(
    new Style({
      image: CustomStyles.event_point
    })
  );
  pointsVectorLayer.getSource().addFeature(focusFeature);
  view.animate({
    center: location,
    duration: 800,
    easing: easeOut,
    zoom: 20,
  });
}

function openDetailCard(type, location) {
  if (focusFeature) {
    pointsVectorLayer.getSource().removeFeature(focusFeature);
  }
  eventDetail.show(type, location)
  // focus on point
  panToLocation(location);
}

const popupOverlay = new Overlay({
  element: popup,
  stopEvent: false,
});
map.addOverlay(popupOverlay);

function formatCoordinate(coordinate) {
  return `
    <table>
      <tbody>
        <tr><th>lon</th><td>${coordinate[0].toFixed(2)}</td></tr>
        <tr><th>lat</th><td>${coordinate[1].toFixed(2)}</td></tr>
      </tbody>
    </table>`;
};

let popover;

let popoverTimeout = () => {
  setTimeout(() => {
    popover.hide();
  }, 3000);
};

var pos = [];
function generate(input) {
  var template = {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": []
    }
  }
  let output = []
  for (let i = 0; i < input.length - 1; i++) {
    let tmp = structuredClone(template);
    tmp.geometry.coordinates = [
      input[i],
      input[i + 1]
    ]
    output.push(tmp);
  }
  console.log(output);
}

map.on('click', function (event) {
  pos.push(event.coordinate);
  generate(pos)
  if (popover) {
    popover.dispose();
    popover = undefined;
  }
  const feature = map.getFeaturesAtPixel(event.pixel)[0];
  if (!feature) {
    return;
  }
  const coordinate = feature.getGeometry().getCoordinates();
  popupOverlay.setPosition([
    coordinate[0],
    coordinate[1],
  ]);

  popover = new bootstrap.Popover(popup, {
    container: popup.parentElement,
    content: formatCoordinate(coordinate),
    html: true,
    offset: [0, 0],
    placement: 'top',
    sanitize: false,
  });
  popover.show();
  popoverTimeout();
});

function randomIntRange(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

function updateTraficConfition() {
  var trafficGeometries = roadVectorLayer.getSource().getFeatures();
  var trafficFeatures = trafficGeometries;
  var trafficConditions = [CustomStyles.traffic_bad, CustomStyles.traffic_poor, CustomStyles.traffic_poor, CustomStyles.traffic_ok, CustomStyles.traffic_ok, CustomStyles.traffic_ok]
  if (trafficFeatures.length < 1) {
    return;
  }

  var randomRange = []
  for (let i = 0; i < randomIntRange(1, 4); i++) {
    randomRange.push(randomIntRange(0, trafficGeometries.length));
  }

  randomRange.forEach(idx => {
    setTimeout(() => {
      var conditionIndex = randomIntRange(0, trafficConditions.length);
      trafficFeatures[idx].setStyle(new Style({
        stroke: trafficConditions[conditionIndex]
      }));
      // console.log(`[Traffic update] segment:${idx} setCondition:${trafficConditions[conditionIndex].getColor()}`);
      if (conditionIndex == 0 && idx > 1 && idx < trafficFeatures.length - 2) {
        trafficFeatures[idx - 1].setStyle(new Style({
          stroke: CustomStyles.traffic_poor
        }));
        // console.log(`[Traffic update] segment:${idx-1},${idx+1} setCondition:${trafficConditions[1].getColor()}`);
      }
    }, 1000);
  });
}

var activeNorthFlights = [];
var activeSouthFlights = [];
function updateFlights() {
  activeNorthFlights.forEach(flight => {
    if (flight.active) {
      flight.update()
    } else {
      airVectorLayer.getSource().removeFeature(flight.plane);
      activeNorthFlights.pop();
    }
  });
  activeSouthFlights.forEach(flight => {
    if (flight.active) {
      flight.update()
    } else {
      airVectorLayer.getSource().removeFeature(flight.plane);
      activeSouthFlights.pop();
    }
  });

  var step = randomIntRange(50, 70);
  var randomSpawn = randomIntRange(0, 2);
  if (randomSpawn == 1 && activeNorthFlights.length < 1) {
    console.log("Spawn flights North");
    var start = data.air_routes[0].start;
    var end = data.air_routes[0].end;
    var newFlightFeature = new Feature({
      geometry: new Point(start)
    });

    airVectorLayer.getSource().addFeature(newFlightFeature);
    var newFlight = new FLight(newFlightFeature, start, end, step);
    activeNorthFlights.push(newFlight);
  }

  randomSpawn = randomIntRange(0, 2);
  if (randomSpawn == 1 && activeSouthFlights.length < 1) {
    console.log("Spawn flights South");
    var start = data.air_routes[1].start;
    var end = data.air_routes[1].end;
    var newFlightFeature = new Feature({
      geometry: new Point(start)
    });

    airVectorLayer.getSource().addFeature(newFlightFeature);
    var newFlight = new FLight(newFlightFeature, start, end, step);
    activeSouthFlights.push(newFlight);
  }
}

window.setInterval(updateTraficConfition, randomIntRange(2000, 8000));
window.setInterval(updateFlights, randomIntRange(2000, 3000));
//==================================
// SOCKETS
//==================================

const socket = new WebSocket('ws://localhost:3000/ws');

// Connection opened
socket.addEventListener('open', (event) => {
  // console.log('WebSocket connection opened');
  // Send a message to the server
  socket.send('Hello from the client!');
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
  // console.log('WebSocket message received:', event.data);
  onEventHandled(event.data);
});

// Connection closed
socket.addEventListener('close', (event) => {
  // console.log('WebSocket connection closed:', event);
});

// Connection error
socket.addEventListener('error', (event) => {
  // console.error('WebSocket error:', event);
});
