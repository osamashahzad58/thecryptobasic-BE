module.exports.wrapMiddlewareForSocketIo = (middleware) => (socket, next) =>
  middleware(socket.handshake, {}, next);
