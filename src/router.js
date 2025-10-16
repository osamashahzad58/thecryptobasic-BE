const usersRouter = require("./users/users.router");
const authRouter = require("./auth/auth.router");
const adminsRouter = require("./admins/admins.router");
const metadataRouter = require("./metadata/metadata.router");
const coinsRouter = require("./cmc-coins/cmc-coins.router");
const watchListRouter = require("./watchlist/watchlist.router");
const transactionRouter = require("./transaction/transaction.router");
const balanceRouter = require("./balance/balance.router");
const portfolioRouter = require("./portfolio/portfolio.router");
const newsRouter = require("./news/news.reouter");

const genrateOtp = require("./email-verification/email-verification.router");

exports.initRoutes = (app) => {
  authRouter.initRoutes(app);
  app.use("/users", usersRouter);
  app.use("/admins", adminsRouter);
  app.use("/metadata", metadataRouter);
  app.use("/genrateOtp", genrateOtp);
  app.use("/coins", coinsRouter);
  app.use("/watchlist", watchListRouter);
  app.use("/transaction", transactionRouter);
  app.use("/balance", balanceRouter);
  app.use("/portfolio", portfolioRouter);
  app.use("/new", newsRouter);
};
