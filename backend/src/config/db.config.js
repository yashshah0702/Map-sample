const { Sequelize } = require("sequelize");
require("dotenv").config();
// Connection configuration
const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "master",
    host: process.env.DB_SERVER,
    dialect: "mssql",
    pool: {
      max: 20, // Increase max connections
      min: 2, // Keep minimum connections alive
      acquire: 60000, // 60s to acquire connection (longer than your 15s timeout)
      idle: 30000, // 30s idle timeout
      evict: 1000, // Check for idle connections every 1s
      handleDisconnects: true,
    },
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 60000, // Add request timeout
        connectionTimeout: 30000, // Add connection timeout
      },
    },
    logging: false,
    timezone: "+00:00",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "master",
    host: process.env.DB_SERVER,
    dialect: "mssql",
    pool: {
      max: 20, // Increase max connections
      min: 2, // Keep minimum connections alive
      acquire: 60000, // 60s to acquire connection (longer than your 15s timeout)
      idle: 30000, // 30s idle timeout
      evict: 1000, // Check for idle connections every 1s
      handleDisconnects: true,
    },
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 60000, // Add request timeout
        connectionTimeout: 30000, // Add connection timeout
      },
    },
    logging: false,
    timezone: "+00:00",
  },
};

// Create Sequelize instance
const sequelize = new Sequelize(
  config[process.env.NODE_ENV || "development"].database,
  config[process.env.NODE_ENV || "development"].username,
  config[process.env.NODE_ENV || "development"].password,
  {
    host: config[process.env.NODE_ENV || "development"].host,
    dialect: "mssql",
    ...config[process.env.NODE_ENV || "development"],
    logging: false,
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to Azure SQL Database successfully");
  } catch (error) {
    console.error("Database Connection Failed!", error);
    throw error;
  }
};

testConnection();

module.exports = {
  sequelize,
  config,
};
