import React, { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// 🛰️ Convert Web Mercator to Lat/Lng
function webMercatorToLatLng(x, y) {
  const R = 6378137;
  const lng = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lng];
}

// Map bounds and center
const southWest = webMercatorToLatLng(16293999.453041892, -2515100.4673742824);
const northEast = webMercatorToLatLng(16293928.445494454, -2515695.474921722);
const mapCenter = [
  (southWest[0] + northEast[0]) / 2,
  (southWest[1] + northEast[1]) / 2,
];

// Vehicle Icons
const truckIcon = new L.Icon({
  iconUrl: "https://raw.github.com/dlolsen5/icons/master/icons8-hauler-100.png",
  iconSize: [28, 28],
});
const excavatorIcon = new L.Icon({
  iconUrl:
    "https://img.icons8.com/external-nawicon-outline-color-nawicon/100/external-excavator-construction-nawicon-outline-color-nawicon.png",
  iconSize: [28, 28],
});
const dozerIcon = new L.Icon({
  iconUrl: "https://raw.github.com/dlolsen5/icons/master/icons8-loader-100.png",
  iconSize: [28, 28],
});

// Helper functions
function randomOffsetCoord([lat, lng], spread = 0.02) {
  const latOffset = (Math.random() - 0.5) * spread;
  const lngOffset = (Math.random() - 0.5) * spread;
  return [lat + latOffset, lng + lngOffset];
}

const excavatorStatuses = [
  "LU Loading",
  "LU Waiting",
  "Hauling",
  "Face Prep",
  "No Trucks Available",
  "Maintain Dump",
  "Meal Break / Crib",
];

// 🗺️ WMS Layer
function GeoImageWMS() {
  const map = useMap();
  useEffect(() => {
    const wms = L.tileLayer
      .wms("https://apollo.geoimage.com.au/erdas-iws/ogc/wms/20217_MtCoolon", {
        layers: "202509_25to30_MineOps.ecw",
        format: "image/jpeg",
        transparent: true,
        version: "1.1.1",
        attribution: "© GeoImage",
        maxZoom: 22,
      })
      .addTo(map);
    return () => map.removeLayer(wms);
  }, [map]);
  return null;
}

// 🧭 Draw Control Component
function DrawControl() {
  const map = useMap();
  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { shapeOptions: { color: "purple" } },
        rectangle: { shapeOptions: { color: "blue" } },
        circle: { shapeOptions: { color: "green" } },
        polyline: { shapeOptions: { color: "orange" } },
        marker: true,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      let coords = [];
      if (layer.getLatLngs) {
        const latlngs = layer.getLatLngs();
        coords = Array.isArray(latlngs[0])
          ? latlngs[0].map((pt) => [pt.lat, pt.lng])
          : [latlngs.lat, latlngs.lng];
      } else if (layer.getLatLng) {
        const latlng = layer.getLatLng();
        coords = [[latlng.lat, latlng.lng]];
      }
      // Format coordinates
      const coordText = coords
        .map((c) => `[${c[0].toFixed(6)}, ${c[1].toFixed(6)}]`)
        .join("\n");
      // Add tooltip with coordinates
      layer.bindTooltip(
        `<div style="font-size:12px; white-space:pre;">${coordText}</div>`,
        {
          permanent: true,
          direction: "top",
          offset: [0, -10],
          className: "coord-tooltip",
        }
      );
      layer.openTooltip();
      console.log("🟢 Drawn:", e.layerType, coords);
    });
    return () => {
      map.removeControl(drawControl);
    };
  }, [map]);
  return null;
}

// 🟣 Abstraction for Polygons with Tooltip
function PolygonWithTooltip({ positions, color, children }) {
  return (
    <Polygon positions={positions} color={color}>
      <Tooltip direction="top">{children}</Tooltip>
    </Polygon>
  );
}

const polygonData = [
  {
    positions: [
      [-22.030811, 146.364864],
      [-22.032569, 146.363205],
      [-22.037202, 146.368094],
      [-22.034197, 146.368314],
      [-22.032261, 146.367021],
    ],
    color: "purple",
    label: "INPIT MP RL250",
  },
  {
    positions: [
      [-22.032904, 146.361242],
      [-22.035434, 146.363462],
      [-22.036168, 146.362622],
      [-22.035277, 146.361473],
      [-22.034197, 146.359879],
    ],
    color: "#32CD32", // parrot green
    label: "INPIT RL165",
  },
  {
    positions: [
      [-22.035714, 146.360936],
      [-22.036162, 146.360286],
      [-22.036918, 146.361269],
      [-22.037496, 146.362531],
      [-22.037157, 146.362751],
    ],
    color: "#87CEEB", // sky blue
    label: "INPIT RL143",
  },
  {
    positions: [
      [-22.036108, 146.360111],
      [-22.03692, 146.361238],
      [-22.037676, 146.362527],
      [-22.039175, 146.3609],
      [-22.037274, 146.358447],
    ],
    color: "blue",
    label: "SOUTH PIT INPIT DUMP",
  },
  {
    positions: [
      [-22.039277, 146.360004],
      [-22.038968, 146.359688],
      [-22.038864, 146.359333],
      [-22.038734, 146.359113],
      [-22.0384, 146.358667],
      [-22.038326, 146.358431],
      [-22.038664, 146.358012],
      [-22.038779, 146.357958],
      [-22.039854, 146.359005],
    ],
    color: "red",
    label: "SHOT390_S24_F1R",
  },
  {
    positions: [
      [-22.039361, 146.359752],
      [-22.039909, 146.359075],
      [-22.041068, 146.360111],
      [-22.04058, 146.360713],
      [-22.040082, 146.361771],
      [-22.03853, 146.364351],
      [-22.037237, 146.363589],
      [-22.039849, 146.360293],
    ],
    color: "#32CD32",
    label: "SHOT345_S29_F1R",
  },
  {
    positions: [
      [-22.044463, 146.361387],
      [-22.043329, 146.363041],
      [-22.044005, 146.363589],
      [-22.045106, 146.361994],
    ],
    color: "#87CEEB", // sky blue
    label: "SHOT383_S34_RL155D11",
  },
  {
    positions: [
      [-22.045255, 146.361817],
      [-22.043961, 146.363562],
      [-22.043284, 146.363014],
      [-22.042398, 146.364384],
      [-22.043981, 146.365796],
      [-22.04409, 146.365678],
      [-22.045503, 146.362731],
      [-22.045811, 146.362339],
    ],
    color: "blue",
    label: "SHOT387_S38_RL155",
  },
  {
    positions: [
      [-22.045829, 146.362364],
      [-22.047332, 146.362594],
      [-22.046247, 146.367237],
      [-22.043545, 146.366636],
    ],
    color: "red",
    label: "SHOT393_S43_AB11/RL175",
  },
  {
    positions: [
      [-22.043213, 146.367175],
      [-22.04393, 146.3658],
      [-22.0417, 146.363706],
      [-22.040685, 146.365009],
    ],
    color: "green",
    label: "SHOT396_S37_RL155",
  },
  {
    positions: [
      [-22.047326, 146.362621],
      [-22.048475, 146.362873],
      [-22.047475, 146.367263],
      [-22.046345, 146.366882],
    ],
    color: "#FF1493", // reddish pink
    label: "SHOT394_S46_AB11/RL175",
  },
  {
    positions: [
      [-22.047376, 146.362615],
      [-22.04747, 146.362158],
      [-22.049501, 146.362438],
      [-22.048481, 146.367053],
      [-22.047589, 146.36679],
      [-22.048487, 146.362875],
    ],
    color: "yellow",
    label: "SHOT353_S47_RL195",
  },
  {
    positions: [
      [-22.041625, 146.36559],
      [-22.041113, 146.366153],
      [-22.040999, 146.366362],
      [-22.042753, 146.367815],
      [-22.04341, 146.367982],
      [-22.043922, 146.367166],
      [-22.043111, 146.366963],
    ],
    color: "yellow",
    label: "shot411_S39_RL155",
  },
  {
    positions: [
      [-22.043938, 146.367158],
      [-22.04352, 146.367829],
      [-22.044251, 146.368124],
      [-22.046001, 146.368327],
      [-22.046115, 146.367705],
    ],
    color: "darkblue",
    label: "SHOT397_S43_RL155",
  },
  {
    positions: [
      [-22.044649, 146.368344],
      [-22.04364, 146.370285],
      [-22.044355, 146.370934],
      [-22.045637, 146.368735],
    ],
    color: "#C71585", // dark pink
    label: "INPIT RL154 MP",
  },
  {
    positions: [
      [-22.041103, 146.3601],
      [-22.042267, 146.36104],
      [-22.040311, 146.363772],
      [-22.040545, 146.364583],
      [-22.040039, 146.365456],
      [-22.038536, 146.364376],
      [-22.040094, 146.361788],
      [-22.040591, 146.360757],
    ],
    color: "#32CD32",
    label: "Shot354_S27_D13R",
  },
  {
    positions: [
      [-22.042424, 146.360829],
      [-22.040323, 146.363767],
      [-22.040677, 146.364991],
      [-22.043353, 146.361567],
    ],
    color: "#87CEEB",
    label: "Shot384_RL135/D11",
  },
  {
    positions: [
      [-22.043363, 146.361575],
      [-22.043886, 146.36215],
      [-22.042373, 146.364389],
      [-22.041721, 146.363675],
    ],
    color: "blue",
    label: "Shot352-S36_RL155",
  },
  {
    positions: [
      [-22.024327, 146.377351],
      [-22.02369, 146.37667],
      [-22.023208, 146.37645],
      [-22.021975, 146.375501],
      [-22.022701, 146.374251],
      [-22.025858, 146.375297],
    ],
    color: "#C71585",
    label: "DUMP 1 RL260",
  },
  {
    positions: [
      [-22.015878, 146.400036],
      [-22.016628, 146.396888],
      [-22.018443, 146.396352],
      [-22.018219, 146.397617],
      [-22.017936, 146.397719],
      [-22.017553, 146.399382],
      [-22.01716, 146.400412],
    ],
    color: "yellow",
    label: "WET_WEATHER_REJECTS_CELL",
  },
  {
    positions: [
      [-22.018508, 146.396266],
      [-22.018503, 146.39773],
      [-22.019746, 146.398036],
      [-22.020049, 146.396738],
    ],
    color: "blue",
    label: "SP6",
  },
  {
    positions: [
      [-22.018552, 146.396212],
      [-22.019989, 146.396652],
      [-22.020203, 146.395381],
      [-22.020158, 146.394711],
      [-22.018682, 146.395124],
    ],
    color: "purple",
    label: "SP8",
  },
  {
    positions: [
      [-22.020268, 146.394421],
      [-22.020333, 146.39515],
      [-22.022565, 146.395225],
      [-22.025161, 146.395729],
      [-22.025111, 146.394421],
      [-22.023167, 146.393847],
      [-22.021159, 146.393885],
    ],
    color: "#32CD32",
    label: "SP9",
  },
  {
    positions: [
      [-22.022432, 146.395826],
      [-22.022283, 146.397274],
      [-22.024853, 146.397902],
      [-22.025146, 146.396529],
      [-22.024977, 146.396357],
    ],
    color: "#32CD32",
    label: "SP7",
  },
  {
    positions: [
      [-22.022283, 146.397338],
      [-22.022069, 146.398529],
      [-22.024241, 146.399071],
      [-22.024515, 146.399103],
      [-22.024813, 146.397987],
    ],
    color: "#87CEEB",
    label: "SP4",
  },
  {
    positions: [
      [-22.020662, 146.395622],
      [-22.02194, 146.39574],
      [-22.02182, 146.39721],
      [-22.020632, 146.397038],
    ],
    color: "purple",
    label: "SP8A",
  },
  {
    positions: [
      [-22.02194, 146.397312],
      [-22.020259, 146.397022],
      [-22.020035, 146.397982],
      [-22.021775, 146.398347],
    ],
    color: "red",
    label: "SP5",
  },
  {
    positions: [
      [-22.027728, 146.36658],
      [-22.029295, 146.365276],
      [-22.029966, 146.36593],
      [-22.03023, 146.366365],
      [-22.030622, 146.367223],
      [-22.030742, 146.367669],
      [-22.030791, 146.368586],
      [-22.030006, 146.368731],
      [-22.029852, 146.368028],
      [-22.029563, 146.368049],
      [-22.029479, 146.367738],
      [-22.029369, 146.367513],
      [-22.029305, 146.367293],
      [-22.029349, 146.367025],
      [-22.027997, 146.367288],
    ],
    color: "yellow",
    label: "Dump_01_RL255",
  },
  {
    positions: [
      [-22.032079, 146.371896],
      [-22.032229, 146.371831],
      [-22.032353, 146.372105],
      [-22.032209, 146.372196],
    ],
    color: "yellow",
    label: "Mathersons Fill Point 1",
  },
  {
    positions: [
      [-22.031861, 146.373151],
      [-22.031935, 146.373339],
      [-22.032144, 146.373205],
      [-22.032094, 146.373054],
    ],
    color: "#00BFFF",
    label: "Mathersons Fill Point 2",
  },
  {
    positions: [
      [-22.031194, 146.374283],
      [-22.031617, 146.373913],
      [-22.03203, 146.374406],
      [-22.031652, 146.374798],
    ],
    color: "yellow",
    label: "WASH PAD",
  },
  {
    positions: [
      [-22.030682, 146.374905],
      [-22.031, 146.375302],
      [-22.031279, 146.374959],
      [-22.030886, 146.37468],
    ],
    color: "green",
    label: "Fuel Farm 3",
  },
  {
    positions: [
      [-22.028668, 146.377137],
      [-22.029797, 146.375822],
      [-22.030364, 146.376354],
      [-22.029205, 146.377738],
    ],
    color: "green",
    label: "OB Workshop",
  },
  {
    positions: [
      [-22.030553, 146.376514],
      [-22.029489, 146.377877],
      [-22.029494, 146.377941],
      [-22.029568, 146.378033],
      [-22.029648, 146.378038],
      [-22.030717, 146.376675],
    ],
    color: "yellow",
    label: "AUXGO",
  },
  {
    positions: [
      [-22.03008, 146.378564],
      [-22.032089, 146.376134],
      [-22.032239, 146.3763],
      [-22.030215, 146.378698],
    ],
    color: "cyan",
    label: "OB GOLINE",
  },
  {
    positions: [
      [-22.026719, 146.383778],
      [-22.029086, 146.385843],
      [-22.029568, 146.385199],
      [-22.02929, 146.383386],
      [-22.029896, 146.382608],
      [-22.030637, 146.381412],
      [-22.030995, 146.380731],
      [-22.030647, 146.380565],
      [-22.03008, 146.380779],
      [-22.029285, 146.380656],
      [-22.028837, 146.380747],
    ],
    color: "cyan",
    label: "DUMP 02_281 North",
  },
  {
    positions: [
      [-22.028991, 146.386219],
      [-22.029474, 146.385355],
      [-22.030911, 146.382823],
      [-22.03113, 146.382973],
      [-22.033049, 146.384996],
      [-22.030931, 146.387855],
    ],
    color: "magenta",
    label: "DUMP_02_270",
  },
  {
    positions: [
      [-22.030414, 146.38293],
      [-22.030941, 146.381519],
      [-22.031488, 146.381798],
      [-22.031483, 146.381997],
      [-22.031378, 146.382142],
      [-22.030861, 146.382694],
    ],
    color: "magenta",
    label: "DUMP 2 REJECTS",
  },
  {
    positions: [
      [-22.030891, 146.382791],
      [-22.031473, 146.381997],
      [-22.031478, 146.381798],
      [-22.031751, 146.381434],
      [-22.032925, 146.38219],
      [-22.032328, 146.383912],
    ],
    color: "green",
    label: "DUMP 2 RL290",
  },
  {
    positions: [
      [-22.028584, 146.391782],
      [-22.029389, 146.390805],
      [-22.029683, 146.390805],
      [-22.031781, 146.392667],
      [-22.031811, 146.392742],
      [-22.032303, 146.393241],
      [-22.031408, 146.394373],
    ],
    color: "green",
    label: "ROM2 SP7",
  },
  {
    positions: [
      [-22.032736, 146.392602],
      [-22.03022, 146.390617],
      [-22.031289, 146.389201],
      [-22.033845, 146.39132],
    ],
    color: "cyan",
    label: "ROM2 SP8",
  },
  {
    positions: [
      [-22.029886, 146.390344],
      [-22.030831, 146.388783],
      [-22.032467, 146.390188],
      [-22.031493, 146.391664],
    ],
    color: "green",
    label: "ROM2",
  },
  {
    positions: [
      [-22.033889, 146.391208],
      [-22.034745, 146.390247],
      [-22.031945, 146.387748],
      [-22.031244, 146.388842],
    ],
    color: "#32CD32",
    label: "ROM2 SP9",
  },
  {
    positions: [
      [-22.034083, 146.3925],
      [-22.033845, 146.392297],
      [-22.034372, 146.391621],
      [-22.034864, 146.392098],
      [-22.034471, 146.392527],
    ],
    color: "magenta",
    label: "ROM Goline Fuel Bay",
  },
  {
    positions: [
      [-22.032651, 146.394099],
      [-22.033337, 146.393251],
      [-22.033492, 146.393369],
      [-22.0328, 146.394217],
    ],
    color: "cyan",
    label: "COAL H/S BAY",
  },
  {
    positions: [
      [-22.032815, 146.394936],
      [-22.035152, 146.392103],
      [-22.035287, 146.392179],
      [-22.035242, 146.392361],
      [-22.033044, 146.395108],
    ],
    color: "cyan",
    label: "ROM GOLINE",
  },
  {
    positions: [
      [-22.030025, 146.359922],
      [-22.030537, 146.359503],
      [-22.031427, 146.35805],
      [-22.030681, 146.355921],
      [-22.029926, 146.354913],
      [-22.029205, 146.355395],
      [-22.02839, 146.356302],
      [-22.027893, 146.357583],
    ],
    color: "magenta",
    label: "DUMP 4 RL283",
  },
  {
    positions: [
      [-22.03096, 146.356119],
      [-22.033575, 146.354628],
      [-22.033093, 146.352048],
      [-22.029712, 146.353212],
    ],
    color: "purple",
    label: "Dump 4 RL281",
  },
  {
    positions: [
      [-22.033685, 146.354869],
      [-22.034719, 146.354606],
      [-22.034967, 146.351559],
      [-22.033675, 146.351672],
      [-22.033048, 146.351887],
    ],
    color: "yellow",
    label: "Dump 4 Regrade",
  },
  {
    positions: [
      [-22.042005, 146.3855],
      [-22.043009, 146.384524],
      [-22.045207, 146.381975],
      [-22.04637, 146.383826],
      [-22.046266, 146.385886],
      [-22.044595, 146.388295],
    ],
    color: "red",
    label: "DUMP 5 RL320",
  },
  {
    positions: [
      [-22.045172, 146.3819],
      [-22.047628, 146.378961],
      [-22.049925, 146.380527],
      [-22.046365, 146.383821],
    ],
    color: "orange",
    label: "DUMP 5 RL310 LIFT",
  },
  {
    positions: [
      [-22.045341, 146.377931],
      [-22.042994, 146.376772],
      [-22.039633, 146.382233],
      [-22.041671, 146.383649],
    ],
    color: "blue",
    label: "DUMP 5 RL280",
  },
  {
    positions: [
      [-22.044923, 146.376606],
      [-22.045067, 146.375656],
      [-22.046216, 146.375887],
      [-22.045962, 146.376981],
    ],
    color: "#C71585",
    label: "RAMP 6 FUEL BAY",
  },
  {
    positions: [
      [-22.018638, 146.381643],
      [-22.019185, 146.382185],
      [-22.019697, 146.381477],
      [-22.01917, 146.380988],
    ],
    color: "red",
    label: "FUEL FARM 2",
  },
  {
    positions: [
      [-22.019269, 146.382249],
      [-22.019846, 146.381471],
      [-22.02098, 146.382539],
      [-22.020309, 146.383327],
    ],
    color: "green",
    label: "TOP SERVICE BAY",
  },
  {
    positions: [
      [-22.021731, 146.38454],
      [-22.022298, 146.383858],
      [-22.023357, 146.384899],
      [-22.022735, 146.385607],
    ],
    color: "orange",
    label: "TYRE BAY",
  },
  {
    positions: [
      [-22.022979, 146.383874],
      [-22.023536, 146.383182],
      [-22.024237, 146.383885],
      [-22.023636, 146.384545],
    ],
    color: "#00BFFF",
    label: "Wash Pad 02",
  },
  {
    positions: [
      [-22.019399, 146.380404],
      [-22.019871, 146.379706],
      [-22.022581, 146.382329],
      [-22.022994, 146.382973],
      [-22.022561, 146.383456],
    ],
    color: "#FFD700",
    label: "HCABUILDPAD",
  },
  {
    positions: [
      [-22.018961, 146.378505],
      [-22.019289, 146.377657],
      [-22.024237, 146.381171],
      [-22.023273, 146.382458],
    ],
    color: "orange",
    label: "Top Soil",
  },
  {
    positions: [
      [-22.017146, 146.374562],
      [-22.019254, 146.372952],
      [-22.024217, 146.377898],
      [-22.023302, 146.379679],
    ],
    color: "magenta",
    label: "Dump 01 RL265",
  },
  {
    positions: [
      [-22.024168, 146.377754],
      [-22.024282, 146.377373],
      [-22.023397, 146.376804],
      [-22.023118, 146.377024],
    ],
    color: "green",
    label: "DUMP 1 RL260 PADDOCK",
  },
  {
    positions: [
      [-22.013227, 146.371579],
      [-22.014798, 146.370807],
      [-22.015942, 146.3713],
      [-22.014639, 146.373103],
      [-22.013784, 146.37262],
    ],
    color: "blue",
    label: "Top Soil Dump",
  },
  {
    positions: [
      [-22.023019, 146.372239],
      [-22.02377, 146.372845],
      [-22.023476, 146.373215],
      [-22.022785, 146.372598],
    ],
    color: "yellow",
    label: "HOT_TYRE_BAY",
  },
  {
    positions: [
      [-22.018121, 146.400203],
      [-22.018493, 146.398256],
      [-22.020163, 146.398637],
      [-22.019472, 146.400509],
    ],
    color: "red",
    label: "SP3",
  },
  {
    positions: [
      [-22.019578, 146.400381],
      [-22.019479, 146.40074],
      [-22.019802, 146.400853],
      [-22.019907, 146.400478],
    ],
    color: "yellow",
    label: "Wash Bin Crusher",
  },
  {
    positions: [
      [-22.020041, 146.400547],
      [-22.021066, 146.400896],
      [-22.021116, 146.400558],
      [-22.020141, 146.400317],
    ],
    color: "blue",
    label: "ROM HS/ PARKUP BAY",
  },
  {
    positions: [
      [-22.02167, 146.401036],
      [-22.021734, 146.400832],
      [-22.021268, 146.400677],
      [-22.021173, 146.400907],
    ],
    color: "blue",
    label: "ROM Fuel Bay",
  },
  {
    positions: [
      [-22.022122, 146.400993],
      [-22.022023, 146.40131],
      [-22.0224, 146.401439],
      [-22.02248, 146.401042],
      [-22.022386, 146.401025],
    ],
    color: "red",
    label: "Bypass Bin Crusher",
  },
  {
    positions: [
      [-22.022711, 146.400971],
      [-22.023037, 146.399474],
      [-22.024681, 146.399818],
      [-22.024327, 146.401552],
    ],
    color: "yellow",
    label: "SP1",
  },
  {
    positions: [
      [-22.020787, 146.398761],
      [-22.020324, 146.400177],
      [-22.02205, 146.400596],
      [-22.022289, 146.399147],
    ],
    color: "magenta",
    label: "SP2",
  },
  {
    positions: [
      [-22.018531, 146.401755],
      [-22.017597, 146.401938],
      [-22.017463, 146.401465],
      [-22.017538, 146.401438],
      [-22.01789, 146.401546],
      [-22.018198, 146.401288],
      [-22.018258, 146.401164],
      [-22.018461, 146.401363],
    ],
    color: "blue",
    label: "REJECT BIN",
  },
  {
    positions: [
      [-22.018208, 146.401099],
      [-22.018133, 146.401266],
      [-22.017848, 146.401347],
      [-22.017564, 146.401336],
      [-22.017654, 146.400788],
      [-22.017928, 146.400729],
      [-22.018102, 146.400793],
    ],
    color: "#32CD32",
    label: "Tear Drop",
  },
];

export default function LiveTruckMap() {
  const totalTrucks = 30;
  const totalExcavators = 10;
  const totalDozers = 10;
  const [vehicles, setVehicles] = useState(() => {
    const all = [];
    for (let i = 0; i < totalTrucks; i++) {
      all.push({
        id: `TK${i + 1}`,
        type: "truck",
        position: randomOffsetCoord(mapCenter, 0.02),
        status: "Empty",
        speed: (Math.random() * 30).toFixed(2),
      });
    }
    for (let i = 0; i < totalExcavators; i++) {
      all.push({
        id: `EX${i + 1}`,
        type: "excavator",
        position: randomOffsetCoord(mapCenter, 0.02),
        status:
          excavatorStatuses[
            Math.floor(Math.random() * excavatorStatuses.length)
          ],
      });
    }
    for (let i = 0; i < totalDozers; i++) {
      all.push({
        id: `DZ${i + 1}`,
        type: "dozer",
        position: randomOffsetCoord(mapCenter, 0.02),
        status: "Maintain Dump",
      });
    }
    return all;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          position: randomOffsetCoord(v.position, 0.0015),
          status:
            v.type === "excavator"
              ? excavatorStatuses[
                  Math.floor(Math.random() * excavatorStatuses.length)
                ]
              : v.status,
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentTime = new Date().toISOString();

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={mapCenter}
        zoom={15}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
      >
        <GeoImageWMS />
        <DrawControl />
        {/* Dump & Site Polygons */}
        {polygonData.map(({ positions, color, label }, i) => (
          <PolygonWithTooltip
            key={label + i}
            positions={positions}
            color={color}
          >
            {label}
          </PolygonWithTooltip>
        ))}
        {/* Vehicles */}
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={v.position}
            icon={
              v.type === "truck"
                ? truckIcon
                : v.type === "excavator"
                ? excavatorIcon
                : dozerIcon
            }
          >
            {v.type === "excavator" ? (
              <Tooltip permanent direction="top" offset={[0, -15]}>
                <span>
                  {v.id}:{v.status}
                </span>
              </Tooltip>
            ) : (
              <Tooltip direction="top" offset={[0, -15]}>
                <span>
                  {v.id}:{v.status}
                </span>
              </Tooltip>
            )}
            <Popup>
              <div style={{ fontSize: "13px", lineHeight: "1.4em" }}>
                <b>{v.id}</b>
                <br />
                <b>time</b> {currentTime}
                <br />
                <b>status</b> {v.status}
                <br />
                {v.type === "truck" && (
                  <>
                    <b>speed</b> {v.speed} km/h <br />
                  </>
                )}
                <b>lat, lon</b> {v.position[0].toFixed(6)},{" "}
                {v.position[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
