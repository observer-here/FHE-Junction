import "@fhevm/hardhat-plugin";

import "@nomicfoundation/hardhat-chai-matchers";

import "@nomicfoundation/hardhat-ethers";

import "@nomicfoundation/hardhat-verify";

import "@typechain/hardhat";

import "hardhat-deploy";

import "hardhat-gas-reporter";

import type { HardhatUserConfig } from "hardhat/config";

import { vars } from "hardhat/config";

import * as dotenv from "dotenv";

dotenv.config();

import "solidity-coverage";

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");

const SEPOLIA_RPC_URL: string = process.env.SEPOLIA_RPC_URL || vars.get("SEPOLIA_RPC_URL", "");
const INFURA_API_KEY: string = process.env.INFURA_API_KEY || vars.get("INFURA_API_KEY", "");

const PRIVATE_KEY: string | undefined = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 0 ? `0x${process.env.PRIVATE_KEY}`.replace(/^0x0x/, "0x") : undefined;

const config: HardhatUserConfig = {

  defaultNetwork: "hardhat",

  namedAccounts: {

    deployer: 0,

  },

  etherscan: {

    apiKey: {

      sepolia: process.env.ETHERSCAN_API_KEY || vars.get("ETHERSCAN_API_KEY", ""),

    },

  },

  gasReporter: {

    currency: "USD",

    enabled: process.env.REPORT_GAS ? true : false,

    excludeContracts: [],

  },

  networks: {

    hardhat: {

      accounts: {

        mnemonic: MNEMONIC,

      },

      chainId: 31337,

    },

    anvil: {

      accounts: {

        mnemonic: MNEMONIC,

        path: "m/44'/60'/0'/0/",

        count: 10,

      },

      chainId: 31337,

      url: "http://localhost:8545",

    },

    sepolia: {

      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 },

      chainId: 11155111,

      url: SEPOLIA_RPC_URL || (INFURA_API_KEY ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}` : ""),

    },

  },

  paths: {

    artifacts: "./artifacts",

    cache: "./cache",

    sources: "./contracts",

    tests: "./tests",

  },

  solidity: {

    version: "0.8.24",

    settings: {

      metadata: {

        // Not including the metadata hash

        // https://github.com/paulrberg/hardhat-template/issues/31

        bytecodeHash: "none",

      },

      // Disable the optimizer when debugging

      // https://hardhat.org/hardhat-network/#solidity-optimizer-support

      optimizer: {

        enabled: true,

        runs: 800,

      },

      viaIR: true, // Required to fix "Stack too deep" errors

      evmVersion: "cancun",

    },

  },

  typechain: {

    outDir: "types",

    target: "ethers-v6",

  },

};

export default config;

