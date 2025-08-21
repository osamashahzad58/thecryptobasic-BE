const { wrapMiddlewareForSocketIo } = require("../utils/websocket.util");
const { postAuthenticate } = require("../middlewares/auth.middleware");
const JWT = require("../../src/common/auth/jwt");

module.exports.applyMiddlewares = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.Authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return next(new Error("No auth token provided or invalid format"));
    }

    // Simulate the authorization header for Passport JWT to extract it correctly
    socket.handshake.headers = {
      ...socket.handshake.headers,
      authorization: token, // Set token in the "authorization" header
    };

    next();
  });

  io.use(wrapMiddlewareForSocketIo(JWT.verifyAccessToken));

  io.use(postAuthenticate);
};
