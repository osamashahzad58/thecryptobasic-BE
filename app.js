require("dotenv").config();
const express = require("express");
const { applyMiddlewares, applyErrorMdiddlewares } = require("./middleware");
const { initRoutes } = require("./src/router");
// const { registerSubscribers } = require("./subscribers");
const redisClient = require("./helpers/redis");
const registerScheduledJobs = require("./jobs");

const app = express();

// (async () => {
//   require("./helpers/db");
//   registerSubscribers();
// })();
// Call startServer()

(async () => {
  // initialize redis store
  await redisClient.connect();
})();

// configure middlewares globally
applyMiddlewares(app);

// initialize routes
initRoutes(app);
// catch 404 and forward to error handler
// configure error middlewares
applyErrorMdiddlewares(app);

registerScheduledJobs();

module.exports = app;
