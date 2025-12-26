# FHE Junction - Backend Deployment Guide

This guide will help you set up and deploy the FHE Junction smart contract to Sepolia testnet.

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- A wallet with Sepolia ETH for gas fees
- Infura account (or any Sepolia RPC provider)

## Step 1: Environment Setup

1. Create a `.env` file in the `backend` directory:

```bash
cd backend
```

2. Create `.env` file with the following content:

```env
PRIVATE_KEY=your_private_key_here_without_0x_prefix
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key_here
```

**Important Notes:**
- `PRIVATE_KEY`: Your wallet's private key **without** the `0x` prefix (or with it, the script handles both)
- `SEPOLIA_RPC_URL`: Your Infura endpoint URL with your API key
- Never commit the `.env` file to version control! 

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including Hardhat, FHEVM plugins, and other tools.

## Step 3: Compile Contracts

```bash
npm run compile
```

This compiles the Solidity contracts and generates TypeScript types.

## Step 4: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This will:
- Deploy a fresh FHEJunction contract to Sepolia
- Save the deployment address in `deployments/sepolia/FHEJunction.json`
- Display the contract address in the console

**After deployment, copy the contract address!** You'll need it for the frontend.

## Step 5: Verify Contract (Optional)

```bash
npm run verify:sepolia <CONTRACT_ADDRESS>
```

This verifies the contract on Etherscan.

## Step 6: Frontend Setup

After deploying the contract, set up the frontend:

```bash
cd ..
cd job-app
```

1. Create a `.env` file in the `job-app` directory:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Replace `0xYourDeployedContractAddress` with the address from Step 4.

2. Install frontend dependencies:

```bash
npm install
```

3. Build the frontend:

```bash
npm run build
```

4. Run development server:

```bash
npm run dev
```

## Complete Setup Commands

Here's the complete setup sequence:

```bash
# Backend setup
cd backend
npm install
npm run compile
npm run deploy:sepolia

# Copy the contract address from the deployment output

# Frontend setup
cd ..
cd job-app
npm install

# Create .env file with VITE_CONTRACT_ADDRESS

# Build or run frontend
npm run build
# OR
npm run dev
```

## Testing

Run tests locally:

```bash
npm test
```

Run tests on Sepolia:

```bash
npm run test:sepolia
```

## Available Scripts

- `npm run compile` - Compile contracts
- `npm run test` - Run tests on local network
- `npm run deploy:sepolia` - Deploy to Sepolia
- `npm run verify:sepolia` - Verify contract on Etherscan
- `npm run lint` - Lint code
- `npm run clean` - Clean build artifacts

## Troubleshooting

### "Insufficient funds" error
- Make sure your wallet has Sepolia ETH
- Get testnet ETH from: https://sepoliafaucet.com/

### "Invalid API key" error
- Check your `SEPOLIA_RPC_URL` is correct
- Ensure your Infura API key is valid

### "Contract already deployed" warning
- The deployment script automatically deletes existing deployments
- If issues persist, manually delete `deployments/sepolia/FHEJunction.json`

### Frontend can't find contract
- Verify `VITE_CONTRACT_ADDRESS` in `job-app/.env` matches the deployed address
- Ensure the address starts with `0x`
- Rebuild the frontend after changing `.env`: `npm run build`

## Network Configuration

The project is configured for:
- **Hardhat Network**: Local development (chainId: 31337)
- **Sepolia Testnet**: Test deployment (chainId: 11155111)

## Security Notes

⚠️ **NEVER commit your `.env` file or private keys to version control!**

- Keep your private key secure
- Use environment variables for sensitive data
- Consider using a hardware wallet for production deployments

## Support

For issues related to:
- **FHEVM/Zama**: Check [Zama documentation](https://docs.zama.ai/fhevm)
- **Hardhat**: Check [Hardhat documentation](https://hardhat.org/docs)
- **Contract deployment**: Review deployment logs in `deployments/sepolia/`

