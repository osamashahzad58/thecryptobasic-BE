// npm i ethers
const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/m1ZDZF0NDLbqkK-we12g0");

const address = "0xYourAddressHere".toLowerCase();

// Transfer event topic
const transferTopic = ethers.id("Transfer(address,address,uint256)");

// fetch logs for last N blocks or range
// async function fetchTokenTransfers(fromBlock, toBlock) {
//   const filter = {
//     fromBlock,
//     toBlock,
//     topics: [transferTopic, null, ethers.hexZeroPad(address, 32)] // incoming transfers (to)
//     // For outgoing, replace third topic with null and second with the address padded
//   };
//   const logs = await provider.getLogs(filter);
//   // decode logs as needed using the token ABI
//   return logs;
// }

// fetchTokenTransfers(15000000, "latest").then(l => console.log(l.length));


const API_KEY = ''; // Replace with your actual Etherscan API key
const WalletAddress = '0x294d0487fdf7acecf342ae70AFc5549A6E90f3e0'; // pass wallet address here
const chainid = 1; // Ethereum Mainnet, change chain id acordingly 
const API_URL = `https://api.etherscan.io/v2/api?chainid=${chainid}&module=account&action=txlist&address=${WalletAddress}&startblock=0&endblock=latest&page=1&offset=1000&sort=asc&apikey=${API_KEY}`;

async function fetchTransactions() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    console.log('✅ API Response:', data);

    if (data.result) {
      console.log(`Total Transactions: ${data.result.length}`);
      console.log('First Transaction:', data.result[0]);
    } else {
      console.log('No result found:', data);
    }
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
  }
}

fetchTransactions();