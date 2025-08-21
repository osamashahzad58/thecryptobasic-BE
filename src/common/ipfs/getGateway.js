const axios = require("axios");

exports.fetchDataFromIPFSGateways = async (uri, result = {}) => {
  try {
    const ipfsHash = uri.replace("ipfs://", "");

    const ipfsGateways = [
      "https://gateway.pinata.cloud/ipfs/",
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://amber-young-lynx-645.mypinata.cloud/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://cf-ipfs.com/ipfs/",
      "https://ipfs.io/ipfs/",
      "https://dweb.link/ipfs/",
      "https://4everland.io/ipfs/",
      "https://w3s.link/ipfs/",
      "https://nftstorage.link/ipfs/",
      "https://storry.tv/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://gateway.originprotocol.com/ipfs/",
      "https://gateway.temporal.cloud/ipfs/",
      "https://gateway.ipfs.io/ipfs/",
      "https://ipfs.eternum.io/ipfs/",
      "https://gateway.serph.network/ipfs/",
      "https://hardbin.com/ipfs/",
      "https://ipfs.jes.xxx/ipfs/",
      "https://gateway.blocksec.com/ipfs/",
      "https://ipfs.mrh.io/ipfs/",
      "https://gateway.fleek.co/ipfs/",
    ];

    for (const gateway of ipfsGateways) {
      const url = `${gateway}${ipfsHash}`;
      const response = await axios.get(url);

      if (response.status === 200) {
        console.log(`Data fetched successfully from:`);
        result = response.data; // Return the fetched data
        break;
      }
    }

    // Fetch proof data from IPFS
    // const ipfsHash = joiner.joinerProof;

    // const proofData = await fetchDataFromIPFSGateways(ipfsHash);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
