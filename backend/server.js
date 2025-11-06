require("module-alias/register");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("@root/src/config/db.config");
const sitemapSocketService = require("@root/src/services/siteMap.socket.service");
dotenv.config();

const app = express();
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize sitemap socket service
sitemapSocketService.initialize(io);

//CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => res.json("Server is running"));

// Add this test route to your app
app.get("/api/test/db-connection", async (req, res) => {
  try {
    console.log("Testing database connection...");

    const startTime = Date.now();

    // Test basic connection
    await sequelize.authenticate();
    console.log("Database authentication successful");

    // Fetch first 10 records from Location_Wenco table
    const query = `
      SELECT TOP (10) 
        [LOC_LOC_IDENT],
        [LOC_CODE],
        [LOC_SNAME],
        [LOC_ACTIVE],
        [LOC_DESC],
        [LOC_TYPE],
        [LOC_MATERIAL_IDENT],
        [LOC_UNLOADING],
        [LOC_AREA],
        [LOC_GT_ENABLE],
        [LOC_CAPACITY],
        [LOC_ASSOC_LOCN],
        [LOC_BEACON_IDENT],
        [LOC_LAYBY],
        [LOC_FDISP],
        [LOC_EDISP],
        [LOC_AREA_TYPE],
        [LOC_TRFR],
        [LOC_BENCH_HT],
        [LOC_EQUIP_IDENT],
        [ALTERNATE_DUMP_LOC_SNAME]
      FROM [bronze].[Location_Wenco]
    `;

    console.log("Executing query to fetch Location_Wenco records...");

    const locationResults = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      timeout: 30000, // 30 second timeout for the query
    });

    const endTime = Date.now();

    console.log(
      `Query completed successfully. Found ${locationResults.length} records.`
    );

    res.json({
      message: "Database connection and query successful",
      status: "Success",
      code: 200,
      data: {
        connectionTime: `${endTime - startTime}ms`,
        database: process.env.DB_DATABASE,
        server: process.env.DB_SERVER,
        recordsFound: locationResults.length,
        locationRecords: locationResults,
      },
    });
  } catch (error) {
    console.error("Database connection/query test failed:", error.message);
    console.error("Full error:", error);

    res.status(500).json({
      message: "Database connection or query failed",
      status: "Failure",
      code: 500,
      data: {
        error: error.message,
        errorType: error.name,
        database: process.env.DB_DATABASE,
        server: process.env.DB_SERVER,
      },
    });
  }
});

const port = process.env.PORT || 3000;


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
