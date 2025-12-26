import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFHEJunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying FHEJunction...");

  // Force fresh deployment by deleting existing deployment
  const existingDeployment = await deployments.getOrNull("FHEJunction");
  if (existingDeployment) {
    log("Removing existing deployment to deploy fresh contract...");
    await deployments.delete("FHEJunction");
  }

  const fheJunction = await deploy("FHEJunction", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  log(`FHEJunction deployed at: ${fheJunction.address}`);
};

export default deployFHEJunction;
deployFHEJunction.tags = ["FHEJunction", "all"];
