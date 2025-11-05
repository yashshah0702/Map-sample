import React, { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Rectangle,
  Polyline,
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

    // Create draw toolbar
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { shapeOptions: { color: "purple" } },
        rectangle: { shapeOptions: { color: "blue" } },
        circle: { shapeOptions: { color: "green" } },
        polyline: { shapeOptions: { color: "orange" } },
        marker: true,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
      },
    });
    map.addControl(drawControl);

    // When user finishes drawing
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

  // Dummy boundaries
  const polygons = [
    {
      color: "green",
      positions: [
        [mapCenter[0] + 0.005, mapCenter[1] - 0.008],
        [mapCenter[0] + 0.003, mapCenter[1] - 0.004],
        [mapCenter[0] + 0.002, mapCenter[1] - 0.009],
      ],
    },
    {
      color: "red",
      positions: [
        [mapCenter[0] - 0.004, mapCenter[1] + 0.006],
        [mapCenter[0] - 0.006, mapCenter[1] + 0.009],
        [mapCenter[0] - 0.009, mapCenter[1] + 0.007],
        [mapCenter[0] - 0.008, mapCenter[1] + 0.004],
      ],
    },
    {
      color: "magenta",
      positions: [
        [mapCenter[0] + 0.006, mapCenter[1] + 0.004],
        [mapCenter[0] + 0.007, mapCenter[1] + 0.007],
        [mapCenter[0] + 0.004, mapCenter[1] + 0.009],
      ],
    },
  ];

  const rectangles = [
    {
      color: "blue",
      bounds: [
        [mapCenter[0] + 0.004, mapCenter[1] - 0.005],
        [mapCenter[0] + 0.002, mapCenter[1] - 0.002],
      ],
    },
    {
      color: "yellow",
      bounds: [
        [mapCenter[0] - 0.006, mapCenter[1] - 0.008],
        [mapCenter[0] - 0.008, mapCenter[1] - 0.005],
      ],
    },
  ];

  const paths = [
    {
      color: "lime",
      positions: [
        [mapCenter[0] - 0.006, mapCenter[1] - 0.008],
        [mapCenter[0], mapCenter[1]],
        [mapCenter[0] + 0.006, mapCenter[1] + 0.007],
      ],
    },
    {
      color: "cyan",
      positions: [
        [mapCenter[0] - 0.004, mapCenter[1] + 0.006],
        [mapCenter[0] + 0.003, mapCenter[1] - 0.006],
      ],
    },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={mapCenter}
        zoom={15}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
      >
        <GeoImageWMS />
        <DrawControl /> {/* 🟢 Added drawing tool */}
        {/* 🟩 Boundaries */}
        {/* 🆕 Custom Layers */}
        <Polygon
          positions={[
            [-22.018638, 146.381643],
            [-22.019185, 146.382185],
            [-22.019697, 146.381477],
            [-22.01917, 146.380988],
          ]}
          color="red"
        >
          <Tooltip direction="top">FUEL FARM 2</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.019269, 146.382249],
            [-22.019846, 146.381471],
            [-22.02098, 146.382539],
            [-22.020309, 146.383327],
          ]}
          color="green"
        >
          <Tooltip direction="top">TOP SERVICE BAY</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.021731, 146.38454],
            [-22.022298, 146.383858],
            [-22.023357, 146.384899],
            [-22.022735, 146.385607],
          ]}
          color="orange"
        >
          <Tooltip direction="top">TYRE BAY</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.022979, 146.383874],
            [-22.023536, 146.383182],
            [-22.024237, 146.383885],
            [-22.023636, 146.384545],
          ]}
          color="#00BFFF" // light blue
        >
          <Tooltip direction="top">Wash Pad 02</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.019399, 146.380404],
            [-22.019871, 146.379706],
            [-22.022581, 146.382329],
            [-22.022994, 146.382973],
            [-22.022561, 146.383456],
          ]}
          color="#FFD700" // golden yellow
        >
          <Tooltip direction="top">HCABUILDPAD</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.018961, 146.378505],
            [-22.019289, 146.377657],
            [-22.024237, 146.381171],
            [-22.023273, 146.382458],
          ]}
          color="orange"
        >
          <Tooltip direction="top">Top Soil</Tooltip>
        </Polygon>
        {/* 🆕 Dump & Service Layers */}
        <Polygon
          positions={[
            [-22.017146, 146.374562],
            [-22.019254, 146.372952],
            [-22.024217, 146.377898],
            [-22.023302, 146.379679],
          ]}
          color="magenta"
        >
          <Tooltip direction="top">Dump 01 RL265</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.024168, 146.377754],
            [-22.024282, 146.377373],
            [-22.023397, 146.376804],
            [-22.023118, 146.377024],
          ]}
          color="green"
        >
          <Tooltip direction="top">DUMP 1 RL260 PADDOCK</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.013227, 146.371579],
            [-22.014798, 146.370807],
            [-22.015942, 146.3713],
            [-22.014639, 146.373103],
            [-22.013784, 146.37262],
          ]}
          color="blue"
        >
          <Tooltip direction="top">Top Soil Dump</Tooltip>
        </Polygon>
        <Polygon
          positions={[
            [-22.023019, 146.372239],
            [-22.02377, 146.372845],
            [-22.023476, 146.373215],
            [-22.022785, 146.372598],
          ]}
          color="yellow"
        >
          <Tooltip direction="top">HOT_TYRE_BAY</Tooltip>
        </Polygon>
        {/* 🚛 Vehicles */}
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
                    <b>speed</b> {v.speed} km/h
                    <br />
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
