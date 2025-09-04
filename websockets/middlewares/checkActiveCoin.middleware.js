const coinsService = require("../../src/cmc-coins/cmc-coins.service");
const defaultTokens = require("../constants/default-tokens.constant");
const axios = require("axios");
const { privateKeys } = require("../../configs");

module.exports.checkActiveCoin = async (payload) => {
  let coinFound = true;
  const { contractAddress } = payload;

  const defaults = Object.values(defaultTokens);
  if (typeof contractAddress == "object") {
    const filtered = contractAddress.filter(
      (el) => !defaults.includes(el.tokenAddress)
    );

    for (value of filtered) {
      const coinResp = await coinsService.getCoinByContractAddress(value);

      if (coinResp.coinNotFound) {
        const coinRespAdd = await coinsService.addActiveCoinWithChainName({
          platformContractAddress: value.tokenAddress,
          chainName: value.chainName,
        });
      }
    }
  } else {
    coinFound = false;
  }

  return { coinFound };
};
