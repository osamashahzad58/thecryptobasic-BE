const usersRouter = require("./users/users.router");
const authRouter = require("./auth/auth.router");
const adminsRouter = require("./admins/admins.router");
const metadataRouter = require("./metadata/metadata.router");

const genrateOtp = require("./email-verification/email-verification.router");

exports.initRoutes = (app) => {
  authRouter.initRoutes(app);
  app.use("/users", usersRouter);
  app.use("/admins", adminsRouter);
  app.use("/metadata", metadataRouter);
  app.use("/genrateOtp", genrateOtp);
};
