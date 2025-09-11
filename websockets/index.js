const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const { SERVER_ENVIRONMENTS } = require("../helpers/constants");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const configs = require("../configs");
let io;
const roomHandler = require("./handlers/room.handler");
const messageHandler = require("./handlers/message.handler");
const { heartbeatHandler } = require("./handlers/ws-heartbeat.handler");
const { disconnectionHandler } = require("./handlers/ws-connection.handler");

module.exports.initServer = async (server) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
      },
      transports: ["websocket", "polling"],
      // path: "/chats/sockets",
    });

    if (process.env.NODE_ENV !== SERVER_ENVIRONMENTS.PRODUCTION) {
      instrument(io, {
        auth: false,
      });
    }

    const pubClient = createClient({
      url: configs.redis.host,
    });
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.on("connection", (socket) => {
      heartbeatHandler(socket, pubClient);
      disconnectionHandler(socket);
      roomHandler(io, socket);
      messageHandler(io, socket);
    });
  } catch (ex) {
    console.log(ex);
    process.exit(-1);
  }
};

module.exports.getIO = () => io;
