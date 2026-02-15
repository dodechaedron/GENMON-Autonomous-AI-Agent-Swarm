const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await signer.provider.getBalance(signer.address);
  console.log("Address:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "MON");
}

main().catch(console.error);
