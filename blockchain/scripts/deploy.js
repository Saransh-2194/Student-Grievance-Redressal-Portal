import hre from "hardhat";

async function main() {
  const GrievanceRegistry = await hre.ethers.getContractFactory("GrievanceRegistry");
  const registry = await GrievanceRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("GrievanceRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
