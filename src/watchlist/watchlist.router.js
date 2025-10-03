const router = require("express").Router();

const { validate } = require("express-validation");
const watchlistController = require("./watchlist.controller");
const JWT = require("../common/auth/jwt");

router.post("/", [JWT.verifyAccessToken], watchlistController.create);
router.get("/byUserId", [JWT.verifyAccessToken], watchlistController.byUserId);
router.post("/toggle", [JWT.verifyAccessToken], watchlistController.toggle);

module.exports = router;
