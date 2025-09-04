const webSockets = require("../../websockets");
const coinsService = require("../../src/cmc-coins/cmc-coins.service");

// module.exports.priceEmitter = async ({ socketId, filtered }) => {
//   try {
//     const io = webSockets.getIO();

//     if (typeof filtered == "string") {
//       const nonDefaultCoinsResp =
//         await coinsService.getCoinPricesByContractAddress(filtered);

//       if (nonDefaultCoinsResp.ex) throw nonDefaultCoinsResp.ex;
//       const coins = nonDefaultCoinsResp.data;
//       io.to(socketId).emit("prices_tomi", coins);
//     } else if (typeof filtered == "object") {
//       for (value of filtered) {
//         const nonDefaultCoinsResp =
//           await coinsService.getCoinPricesByContractAddress(value);

//         if (nonDefaultCoinsResp.ex) throw nonDefaultCoinsResp.ex;
//         const coins = nonDefaultCoinsResp.data;
//         if (coins) {
//           io.to(socketId).emit("prices_tomi", coins);
//         }
//       }
//     }

//     // for (coins of otherDataCoins) {

//     // }
//   } catch (ex) {
//     console.log(ex);
//   }
// };

// module.exports.defaultPriceEmitter = async (socketId) => {
//   try {
//     const io = webSockets.getIO();
//     const defaultCoinsResp = await coinsService.getDefaultCoinsPrice();
//     if (defaultCoinsResp.ex) throw defaultCoinsResp.ex;
//     const defaultCoins = defaultCoinsResp.data;

//     io.to(socketId).emit("prices_tomi", {
//       defaultCoins,
//       emittedFrom: "Connecting socket : Default",
//     });
//   } catch (ex) {
//     console.log(ex);
//   }
// };
