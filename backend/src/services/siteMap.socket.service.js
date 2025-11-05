// Required dependencies
const { sequelize } = require("@config/db.config");
const { Sequelize } = require("sequelize");
const { GET_LATEST_SITEMAP_DATA } = require("../queries/siteMap.queries");
const { registerCronJob } = require("@root/src/utils/cronJob.utils");
const { socketConstants } = require("../constants/socket.constants");

let ioInstance = null;

let truckData = [
  // ... (your truckData array as before)
  {
    name: "TK16",
    time: "2025-11-05T18:52:50.000Z",
    status: "Maintenance Other",
    speed: 0,
    lat: -22.031609,
    lon: 146.351283
  },
  {
    name: "TK39",
    time: "2025-11-05T19:38:16.000Z",
    status: "Hauling",
    speed: 9.22,
    lat: -22.033762,
    lon: 146.359803
  },
  {
    name: "TK07",
    time: "2025-11-05T18:45:05.000Z",
    status: "Loading",
    speed: 0.5,
    lat: -22.034500,
    lon: 146.341210
  },
  {
    name: "TK22",
    time: "2025-11-05T18:59:44.000Z",
    status: "Travel Empty",
    speed: 13.4,
    lat: -22.038200,
    lon: 146.355320
  },
  {
    name: "TK10",
    time: "2025-11-05T18:47:30.000Z",
    status: "Unloading",
    speed: 0,
    lat: -22.036200,
    lon: 146.350110
  },
  {
    name: "TK21",
    time: "2025-11-05T18:50:11.000Z",
    status: "Stopped",
    speed: 0,
    lat: -22.037100,
    lon: 146.358790
  },
  {
    name: "TK11",
    time: "2025-11-05T19:01:13.000Z",
    status: "Hauling",
    speed: 8.4,
    lat: -22.034800,
    lon: 146.354310
  },
  {
    name: "TK09",
    time: "2025-11-05T19:02:50.000Z",
    status: "Maintenance Other",
    speed: 0,
    lat: -22.035900,
    lon: 146.357000
  },
  {
    name: "TK30",
    time: "2025-11-05T19:10:12.000Z",
    status: "Travel Empty",
    speed: 11.2,
    lat: -22.040200,
    lon: 146.352800
  },
  {
    name: "TK44",
    time: "2025-11-05T19:15:10.000Z",
    status: "Unloading",
    speed: 0,
    lat: -22.033100,
    lon: 146.349200
  }
];

// --- Helper: Randomly change lat/lon slightly for demonstration ---
const updateTruckCoordinates = () => {
  truckData = truckData.map(truck => {
    // Only move trucks that aren't stopped/maintenance for realism, or move all if you prefer
    if (truck.status === 'Stopped' || truck.status === "Maintenance Other") {
      return truck;
    }
    // Small random delta for realistic movement (about ±0.0005 degrees)
    const deltaLat = (Math.random() - 0.5) * 0.001;
    const deltaLon = (Math.random() - 0.5) * 0.001;
    return {
      ...truck,
      lat: +(truck.lat + deltaLat).toFixed(6),
      lon: +(truck.lon + deltaLon).toFixed(6),
      // Optionally simulate minor speed variation
      speed:
        truck.speed > 0
          ? +(truck.speed + (Math.random() - 0.5) * 0.5).toFixed(2)
          : 0
    };
  });
};

const getSitemapData = async () => {
  try {
    const [latestSitemapData] = await sequelize.query(GET_LATEST_SITEMAP_DATA, {
      type: Sequelize.QueryTypes.SELECT,
    });
    return { latestSitemapData };
  } catch (error) {
    console.log("Error fetching sitemap data:", error);
    throw error;
  }
};

const broadcastSitemapData = async () => {
  try {
    const data = await getSitemapData();
    ioInstance?.emit(socketConstants.SITE_MAP_UPDATE_EVENT, {
      data
    });
  } catch (error) {
    console.log("Error broadcasting sitemap data:", error);
  }
};

const broadcastTruckData = () => {
  try {
    updateTruckCoordinates(); // <-- update coordinates before emitting
    ioInstance?.emit(socketConstants.TRUCK_UPDATE_EVENT, {
      data: truckData
    });
  } catch (error) {
    console.log("Error broadcasting truck data:", error);
  }
};

const setupSockets = () => {
  registerCronJob("sitemap", "*/15 * * * * *", broadcastSitemapData);
  registerCronJob("truck", "*/15 * * * * *", broadcastTruckData);

  ioInstance.on(socketConstants.CONNECTION, async (socket) => {
    console.log('socket connected....');

    // Initial sitemap data
    broadcastSitemapData();

    // Initial truck data
    broadcastTruckData();

    socket.on(socketConstants.DISCONNECT, () => {
      console.log('socket disconnected...');
    });
  });
};

const initialize = (io) => {
  if (ioInstance) return; // Prevent double-init
  ioInstance = io;
  setupSockets();
};

module.exports = {
  initialize,
};