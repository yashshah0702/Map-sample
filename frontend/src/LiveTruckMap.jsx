import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Rectangle,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🛰️ Convert Web Mercator to Lat/Lng
function webMercatorToLatLng(x, y) {
  const R = 6378137;
  const lng = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lng];
}

// 🗺️ Coordinates
const southWest = webMercatorToLatLng(16293999.453041892, -2515100.4673742824);
const northEast = webMercatorToLatLng(16293928.445494454, -2515695.474921722);

function randomLatLng(sw, ne) {
  // Constrain to a smaller area within bounds to prevent edge cases
  const buffer = 0.00001; // Small buffer from edges
  const lat = sw[0] + buffer + Math.random() * (ne[0] - sw[0] - buffer * 2);
  const lng = sw[1] + buffer + Math.random() * (ne[1] - sw[1] - buffer * 2);
  return [lat, lng];
}

function generateCurvedPath(start, end, segments = 5) {
  const curve = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Reduce random deviation to keep paths tighter
    const lat =
      start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * 0.00001;
    const lng =
      start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * 0.00001;
    curve.push([lat, lng]);
  }
  return curve;
}

// 🚛 Truck icon
const truckIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// 📍 Location pin icon
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

export default function LiveTruckMap() {
  const [trucks, setTrucks] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [lines, setLines] = useState([]);
  const [triangles, setTriangles] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const generatedTrucks = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      name: `TR0${i + 1}`,
      position: randomLatLng(southWest, northEast),
    }));
    setTrucks(generatedTrucks);

    const generatedRectangles = Array.from({ length: 6 }, () => {
      const c1 = randomLatLng(southWest, northEast);
      const c2 = [
        c1[0] + (Math.random() * (northEast[0] - southWest[0])) / 300, // Smaller rectangles
        c1[1] + (Math.random() * (northEast[1] - southWest[1])) / 300,
      ];
      return [c1, c2];
    });
    setRectangles(generatedRectangles);

    const generatedTriangles = Array.from({ length: 4 }, () => {
      const a = randomLatLng(southWest, northEast);
      const b = [
        a[0] + (Math.random() * (northEast[0] - southWest[0])) / 400, // Smaller triangles
        a[1] + (Math.random() * (northEast[1] - southWest[1])) / 400,
      ];
      const c = [
        a[0] - (Math.random() * (northEast[0] - southWest[0])) / 400,
        a[1] + (Math.random() * (northEast[1] - southWest[1])) / 400,
      ];
      return [a, b, c];
    });
    setTriangles(generatedTriangles);

    const generatedLines = Array.from({ length: 6 }, () =>
      generateCurvedPath(
        randomLatLng(southWest, northEast),
        randomLatLng(southWest, northEast)
      )
    );
    setLines(generatedLines);

    const generatedLocations = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      name: ["Plant Entrance", "Crusher Area", "Loading Zone"][i],
      position: randomLatLng(southWest, northEast),
    }));
    setLocations(generatedLocations);
  }, []);

  // Add GeoImage WMS as a dedicated component so we can use Leaflet's WMS layer
  function GeoImageWMS() {
    const map = useMap();
    useEffect(() => {
      // Add WMS tile layer (matches the sample HTML you provided)
      const wms =
        // L.tileLayer(
        //   "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        //   { attribution: "Tiles © Esri" }
        // )
        L.tileLayer
          .wms(
            "https://apollo.geoimage.com.au/erdas-iws/ogc/wms/20217_MtCoolon",
            {
              layers: "202509_25to30_MineOps.ecw",
              format: "image/jpeg",
              transparent: true,
              version: "1.1.1",
              attribution: "© GeoImage",
              maxZoom: 22,
            }
          )
          .addTo(map);

      return () => {
        if (map && wms) map.removeLayer(wms);
      };
    }, [map]);
    return null;
  }

  // create simple SVG pin DivIcon to mimic the vector-marker icons
  const createPinIcon = (color = "#ff8000") =>
    new L.DivIcon({
      className: "custom-pin-icon",
      html: `
        <svg width="30" height="50" viewBox="0 0 32 52" xmlns="http://www.w3.org/2000/svg">
          <path d="M16,1 C7.7,1 1,7.66 1,15.865 C1,24.076 16,51 16,51 C16,51 31,24.076 31,15.865 C31,7.656 24.28,1 16,1 Z" fill="${color}" />
          <circle cx="16" cy="18" r="6" fill="#fff" />
        </svg>
      `,
      iconSize: [30, 50],
      iconAnchor: [15, 50],
      popupAnchor: [0, -45],
    });

  // Move trucks periodically with smooth transitions (commented out to stop movement)
  /*useEffect(() => {
    const interval = setInterval(() => {
      setTrucks((prev) =>
        prev.map((t) => {
          const newPos = [
            t.position[0] + (Math.random() - 0.5) * 0.00001,
            t.position[1] + (Math.random() - 0.5) * 0.00001,
          ];
          // Ensure the new position stays within bounds
          newPos[0] = Math.max(southWest[0], Math.min(northEast[0], newPos[0]));
          newPos[1] = Math.max(southWest[1], Math.min(northEast[1], newPos[1]));
          return {
            ...t,
            position: newPos,
          };
        })
      );
    }, 2000); // More frequent but smaller updates
    return () => clearInterval(interval);
  }, []);*/

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        bounds={[southWest, northEast]}
        maxBounds={[southWest, northEast]}
        maxBoundsViscosity={1.0}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 🌍 GeoImage WMS base layer (matches the GeoImage WMS tiles) */}
        <GeoImageWMS />

        {/* 🛣️ Curved Lines */}
        {lines.map((line, i) => (
          <Polyline
            key={i}
            positions={line}
            color={
              [
                "#00ff00",
                "#ffff00",
                "#ff00ff",
                "#00ffff",
                "#ffa500",
                "#0080ff",
              ][i]
            }
            weight={3}
          />
        ))}

        {/* 🟩 Rectangles */}
        {rectangles.map((b, i) => (
          <Rectangle
            key={i}
            bounds={b}
            color={
              [
                "#00ff00",
                "#ff0000",
                "#0000ff",
                "#ffff00",
                "#ff00ff",
                "#ffa500",
              ][i]
            }
            weight={2}
          >
            <Popup>Zone {i + 1}</Popup>
          </Rectangle>
        ))}

        {/* 🔺 Triangles */}
        {triangles.map((points, i) => (
          <Polygon
            key={i}
            positions={points}
            color={["#ff007f", "#00ffff", "#ffaa00", "#ff00ff"][i]}
            weight={2}
          >
            <Popup>Triangle {i + 1}</Popup>
          </Polygon>
        ))}

        {/* 📍 Locations */}
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={loc.position}
            icon={createPinIcon("#4080ff")}
          >
            <Popup>{loc.name}</Popup>
          </Marker>
        ))}

        {/* 🚛 Trucks */}
        {trucks.map((truck) => (
          <Marker
            key={truck.id}
            position={truck.position}
            icon={createPinIcon("#ff8000")}
            eventHandlers={{
              add: (e) => {
                // Enable smooth transitions on the marker element
                e.target._icon.style.transition = "transform 0.5s ease-out";
              },
            }}
          >
            <Popup>
              <b>{truck.name}</b>
              <br />
              Lat: {truck.position[0].toFixed(5)} <br />
              Lng: {truck.position[1].toFixed(5)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
