const router = require("express").Router();
const { validate } = require("express-validation");
const newsController = require("./news.controller");

router.get("/", newsController.getAllNews);

module.exports = router;
