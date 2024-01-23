import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';

const road_network_width = 6;

export const CustomStyles = {
    event_point: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: '#3399CC',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2,
        }),
      }),
    traffic_ok: new Stroke({
        color: '#0B4F21',
        width: road_network_width - 1,
    }),
    traffic_poor: new Stroke({
        color: '#9BD021',
        width: road_network_width,
    }),
    traffic_bad: new Stroke({
        color: '#510808',
        width: road_network_width + 1,
    }),
}