const { Web3 } = require("web3");
const abi = require("./helpers/finalizeDataRequest.json");

const web3 = new Web3(
  "https://warmhearted-hidden-thunder.arbitrum-mainnet.quiknode.pro/c62b40f2ebe9ff587cc9bcd9ccac55b111502273/"
); // Best Arbitrum RPC
const main = async () => {
  const tokenContract = new web3.eth.Contract(
    abi,
    "0xf84f68fed9e1a14799e0e503f615b2da54179f24"
  );
  const name = await tokenContract.methods.calculateWinnerReadOnly().call();
  console.log("Winner index from smart contract:", name);
};

main();
