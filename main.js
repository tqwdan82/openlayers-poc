import './style.css';
import {Feature, Map, View, Overlay} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {Point} from 'ol/geom.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';

function getRandomPoint(){
  const generateRandomPointWithinBounds = (point1, point2, point3, point4) => {
    const minX = Math.min(point1[0], point2[0], point3[0], point4[0]);
    const minY = Math.min(point1[1], point2[1], point3[1], point4[1]);
    const maxX = Math.max(point1[0], point2[0], point3[0], point4[0]);
    const maxY = Math.max(point1[1], point2[1], point3[1], point4[1]);
  
    const randomX = minX + Math.random() * (maxX - minX);
    const randomY = minY + Math.random() * (maxY - minY);
  
    return [randomX, randomY];
  };

  const point1 = [11575030.372665226, 150116.2697379953];
  const point2 = [11576008.25991508, 152472.91197662777];
  const point3 = [11575780.569510564, 149733.91803992068];
  const point4 = [11576785.687300716, 152169.0202072112];

  const randomPoint = generateRandomPointWithinBounds(point1, point2, point3, point4);
  console.log("Random Point:", randomPoint);
  return randomPoint;
}

const list_event_history = document.getElementById("list-event-history");

const place = getRandomPoint();
const point = new Point(place);

let currentFeature = new Feature({
  geometry: point,
});

let pointsArray = [currentFeature];

const pointsSource = new VectorSource({
  features: pointsArray,
});

const pointsLayer = new VectorLayer({
  source: pointsSource,
  style: {
    'icon-src': 'static/flame.png',
    'icon-anchor': [0.5, 0.5],
    'icon-height': 26,
  },
});

// Listener function
function onEventHandled(dataString) {
  const data = JSON.parse(dataString);
  console.log('Event handled:', data);

  setTimeout(()=>{
    pointsSource.removeFeature(currentFeature);
    // const place2 = getRandomPoint();
    const point2 = new Point(data.location);
    currentFeature =new Feature({
      geometry: point2
    });
    pointsSource.addFeature(currentFeature);
    // pointsLayer.setSource(pointsSource);

    var li = document.createElement("li");
    li.appendChild(document.createTextNode(data.location));
    list_event_history.appendChild(li);

  }, data.incidentTTL);
}

// setTimeout(()=>{
//   pointsSource.removeFeature(currentFeature);
//   const place2 = getRandomPoint();
//   const point2 = new Point(place2);
//   currentFeature = new Feature(point2);
//   pointsSource.addFeature(currentFeature);
//   // pointsLayer.setSource(pointsSource);
// },5000);

const osmTileLayer = new TileLayer({
  source: new OSM()
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

const map = new Map({
  target: 'map',
  layers: [
    osmTileLayer,
    pointsLayer,
  ],
  view: new View({
    center: [11576030.93506485,150934.52190890713],
    zoom: 16,
    rotation: 1.16,
  }),
});

const element = document.getElementById('popup');

const popup = new Overlay({
  element: element,
  stopEvent: false,
});
map.addOverlay(popup);

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
  setTimeout(()=>{
    popover.hide();
  },3000);
};

map.on('click', function(event){
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
    popup.setPosition([
      coordinate[0],
      coordinate[1],
    ]);
  
    popover = new bootstrap.Popover(element, {
      container: element.parentElement,
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
