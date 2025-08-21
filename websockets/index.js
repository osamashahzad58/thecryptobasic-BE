const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const configs = require("../configs");
const { applyMiddlewares } = require("./middlewares");
const { heartbeatHandler } = require("./utils/ws-heartbeat.util");
const { disconnectionHandler } = require("./utils/ws-connection.util");
const redisClient = require("../helpers/redis");

let io;

module.exports.initServer = async (server) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
      },
      transports: ["websocket"],
      pingInterval: 30000,
      pingTimeout: 15000,
    });
    const pubClient = createClient({
      url: configs.redis.host,
    });
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    // apply middlewares
    applyMiddlewares(io);

    io.on("connection", async (socket) => {
      const { user } = socket.handshake;
      if (user) {
        await redisClient.set(
          `user:${user.id}`,
          socket.id,

          {
            XX: true,
            EX: 60,
          }
        );
      }

      heartbeatHandler(socket);
      disconnectionHandler(socket);
    });
  } catch (ex) {
    console.log("Error while initializing websocket server ===>", ex.message);
    process.exit(-1);
  }
};

module.exports.getIO = () => io;
