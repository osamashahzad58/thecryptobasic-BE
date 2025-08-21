const utils = require("ethereumjs-util");

exports.verifyEthSign = (walletAddress, sign) => {
  r = utils.toBuffer(sign.slice(0, 66));
  s = utils.toBuffer("0x" + sign.slice(66, 130));
  v = utils.toBuffer("0x" + sign.slice(130, 132));

  const m = Buffer.from(walletAddress);
  const prefix = Buffer.from("\x19Ethereum Signed Message:\n");
  const prefixedMsg = utils.keccak256(
    Buffer.concat([prefix, Buffer.from(String(m.length)), m])
  );
  pub = utils.ecrecover(prefixedMsg, v, r, s);
  adr = "0x" + utils.pubToAddress(pub).toString("hex");

  return adr.toLowerCase() == walletAddress.toLowerCase();
};
