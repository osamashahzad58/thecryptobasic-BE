const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const errorMiddleware = require("./error.middleware");
const notFoundMiddleware = require("./404.middleware");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("src/docs/swagger.yaml");
const path = require("path");

module.exports.applyMiddlewares = (app) => {
  app.use(cors());
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  // app.use(express.static('public'));
  app.use(logger("dev"));
  app.use(express.json({ limit: "50Mb" }));
  app.use(express.urlencoded({ limit: "50Mb", extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));

  if (process.env.NODE_ENV !== "production") {
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customSiteTitle: "theCryptoBasic",
      })
    );
  }
};

module.exports.applyErrorMdiddlewares = (app) => {
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
};
