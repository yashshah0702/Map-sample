const { DataTypes } = require("sequelize");
const { sequelize } = require("@root/src/config/db.config");

// Define models for existing tables
const models = {
  SalesPerformance: sequelize.define(
    "SalesPerformance",
    {
      ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Date: DataTypes.DATE,
      Revenue: DataTypes.DECIMAL(18, 2),
      Units: DataTypes.INTEGER,
      Region: DataTypes.STRING(50),
      ProductCategory: DataTypes.STRING(50),
      CreatedBy: {
        type: DataTypes.STRING(100),
        defaultValue: "adani",
      },
      CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: "2025-03-25 06:11:56",
      },
    },
    {
      tableName: "SalesPerformance",
    }
  ),

  UserActivity: sequelize.define(
    "UserActivity",
    {
      ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Date: DataTypes.DATE,
      ActiveUsers: DataTypes.INTEGER,
      PageViews: DataTypes.INTEGER,
      SessionDuration: DataTypes.DECIMAL(10, 2),
      BounceRate: DataTypes.DECIMAL(5, 2),
      CreatedBy: {
        type: DataTypes.STRING(100),
        defaultValue: "adani",
      },
      CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: "2025-03-25 06:11:56",
      },
    },
    {
      tableName: "UserActivity",
    }
  ),

  ProductPerformance: sequelize.define(
    "ProductPerformance",
    {
      ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ProductName: DataTypes.STRING(100),
      MonthYear: DataTypes.DATE,
      SalesAmount: DataTypes.DECIMAL(18, 2),
      UnitsShipped: DataTypes.INTEGER,
      ReturnRate: DataTypes.DECIMAL(5, 2),
      CreatedBy: {
        type: DataTypes.STRING(100),
        defaultValue: "adani",
      },
      CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: "2025-03-25 06:11:56",
      },
    },
    {
      tableName: "ProductPerformance",
    }
  ),
};

module.exports = models;
