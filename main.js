import './style.css';
import { Feature, Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { easeIn, easeOut } from 'ol/easing.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';

const airport = [11576030.93506485, 150934.52190890713];

let currentPoint = airport;
let currentFeature;
let focusFeature;
let pointsArray = [];

const pointsSource = new VectorSource({
  features: pointsArray,
});
const pointsLayer = new VectorLayer({
  source: pointsSource,
  style: {
    'icon-src': '/flame.png',
    'icon-anchor': [0.5, 0.5],
    'icon-height': 26,
  },
});

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

const view = new View({
  center: airport,
  zoom: 16,
  rotation: 1.16,
});

const map = new Map({
  target: 'map',
  layers: [
    osmTileLayer,
    pointsLayer,
  ],
  view: view,
});


const popup = document.getElementById('popup');
const ListEventHistory = document.getElementById("list-event-history");
const cardEventDetail = document.getElementById("card-event-info");
const eventDetailLocate = document.getElementById("event-detail-locate");
const eventDetailClose = document.getElementById("event-detail-close");

// function getRandomPoint() {
//   const generateRandomPointWithinBounds = (point1, point2, point3, point4) => {
//     const minX = Math.min(point1[0], point2[0], point3[0], point4[0]);
//     const minY = Math.min(point1[1], point2[1], point3[1], point4[1]);
//     const maxX = Math.max(point1[0], point2[0], point3[0], point4[0]);
//     const maxY = Math.max(point1[1], point2[1], point3[1], point4[1]);

//     const randomX = minX + Math.random() * (maxX - minX);
//     const randomY = minY + Math.random() * (maxY - minY);

//     return [randomX, randomY];
//   };

//   const point1 = [11575030.372665226, 150116.2697379953];
//   const point2 = [11576008.25991508, 152472.91197662777];
//   const point3 = [11575780.569510564, 149733.91803992068];
//   const point4 = [11576785.687300716, 152169.0202072112];

//   const randomPoint = generateRandomPointWithinBounds(point1, point2, point3, point4);
//   console.log("Random Point:", randomPoint);
//   return randomPoint;
// }

// const place = getRandomPoint();
// const point = new Point(place);

// let currentFeature = new Feature({
//   geometry: point,
// });

// Listener function
function onEventHandled(dataString) {
  if (dataString === "Connected") {
    return;
  }
  const data = JSON.parse(dataString);
  console.log('Event handled:', data);

  setTimeout(() => {
    if (currentFeature !== undefined) {
      pointsSource.removeFeature(currentFeature);
    }

    currentFeature = new Feature({
      geometry: new Point(data.location)
    });
    pointsSource.addFeature(currentFeature);

    // Append to hist list
    var li = document.createElement("li");
    const event_date = new Date(data.timestamp);
    const formate_date = event_date.getDate() + "/" + event_date.getMonth() + 1 + " " + event_date.getHours() + ":" + event_date.getMinutes() + ":" + event_date.getSeconds();
    li.classList.add("list-group-item");
    li.classList.add("list-group-item-action");
    li.classList.add("list-group-item-dark");
    li.appendChild(document.createTextNode(`
    [${formate_date}][${data.incidentType}] ${data.location}
    `));
    li.addEventListener('click', evt => {
      openDetailCard(data.incidentType, data.location);
    })
    ListEventHistory.appendChild(li);
  }, data.incidentTTL);
}

function panToLocation(location) {
  if (focusFeature) {
    pointsSource.removeFeature(focusFeature);
  }
  focusFeature = new Feature({
    geometry: new Point(location),
  });
  focusFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: '#3399CC',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2,
        }),
      }),
    })
  );
  pointsSource.addFeature(focusFeature);
  view.animate({
    center: location,
    duration: 800,
    easing: easeOut,
    zoom: 20,
  });
}

eventDetailLocate.addEventListener('click', ev => {
  panToLocation(currentFeature ? currentPoint : airport);
});

eventDetailClose.addEventListener('click', ev => {
  if (focusFeature) {
    pointsSource.removeFeature(focusFeature);
  }
  view.animate({
    center: airport,
    duration: 800,
    easing: easeOut,
    zoom: 16,
  });
  cardEventDetail.classList.add("invisible");
});

function openDetailCard(type, location) {
  if (focusFeature) {
    pointsSource.removeFeature(focusFeature);
  }
  cardEventDetail.classList.remove("invisible");
  // fill detail card
  currentPoint = location
  document.getElementById("event-info-event-type").innerHTML = type;
  document.getElementById("event-info-event-location").innerHTML = location;

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

map.on('click', function (event) {
  console.log(event);
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
}
);

const socket = new WebSocket('ws://localhost:3000/ws');

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('WebSocket connection opened');
  // Send a message to the server
  socket.send('Hello from the client!');
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
  console.log('WebSocket message received:', event.data);
  onEventHandled(event.data);
});

// Connection closed
socket.addEventListener('close', (event) => {
  console.log('WebSocket connection closed:', event);
});

// Connection error
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});
