const usersAuthRouter = require("./users/auth.router");
const adminAuthRouter = require("./admin/auth.router");
const creatorsRouter = require("./creators/auth.router");

module.exports.initRoutes = (app) => {
  app.use("/auth/admins", adminAuthRouter);
  app.use("/auth/creator", creatorsRouter);
  app.use("/auth/users", usersAuthRouter);
};
