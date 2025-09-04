require("dotenv").config();
const express = require("express");
const { applyMiddlewares, applyErrorMdiddlewares } = require("./middleware");
const { initRoutes } = require("./src/router");
const redisClient = require("./helpers/redis");

// Create app instance
const app = express();

// DB init
require("./helpers/db");

// Redis init
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error(
      "Redis connect error:",
      err && err.message ? err.message : err
    );
  }
})();

// Global middlewares
applyMiddlewares(app);

// Routes
initRoutes(app);

// Error handlers
applyErrorMdiddlewares(app);

module.exports = app; // <--- only the app
