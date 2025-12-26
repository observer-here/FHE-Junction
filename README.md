# FHE Junction 🔐

A decentralized job marketplace built on Ethereum using **Fully Homomorphic Encryption (FHE)** powered by Zama's FHEVM. This platform enables private job applications where sensitive candidate data remains encrypted on-chain.

## 🌟 Features

### For Job Seekers (Individual Mode)
- **Encrypted Profiles**: Store salary expectations, experience, education, and personal information encrypted on-chain
- **Private Job Applications**: Apply to jobs without revealing sensitive data until evaluation
- **Eligibility Checking**: Decrypt and view eligibility results after company evaluation
- **Application Tracking**: Monitor all your job applications in one place

### For Employers (Company Mode)
- **Company Profiles**: Create and manage company profiles
- **Job Postings**: Create job listings with encrypted requirements (salary, experience, education)
- **Private Applicant Evaluation**: Evaluate candidates using FHE without seeing their data
- **Secure Contact Access**: Access contact information only for eligible candidates

### Security & Privacy
- 🔒 **End-to-End Encryption**: All sensitive data encrypted using Zama FHEVM
- 🔐 **On-Chain Privacy**: Data remains encrypted on the blockchain
- 🛡️ **No Data Leaks**: Companies can't see candidate data until evaluation
- ✅ **Transparent Evaluation**: Eligibility computed on-chain using FHE

## 🏗️ Architecture

```
FHE Junction/
├── backend/          # Smart contracts & deployment
│   ├── contracts/   # Solidity contracts (FHEJunction.sol)
│   ├── deploy/      # Deployment scripts
│   └── tests/       # Contract tests
│
└── Job-App/         # Frontend React application
    ├── src/
    │   ├── components/  # React components
    │   ├── hooks/       # Custom hooks (FHE encryption, contract interaction)
    │   └── config/      # Configuration files
    └── dist/            # Production build
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- A wallet with Sepolia ETH (for gas fees)
- Infura account (or any Sepolia RPC provider)
- MetaMask or compatible Web3 wallet

### Installation & Deployment

#### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
# Add your PRIVATE_KEY and SEPOLIA_RPC_URL

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

**Copy the deployed contract address** - you'll need it for the frontend!

📖 **Detailed backend guide**: See [backend/README.md](./backend/README.md)

#### 2. Frontend Setup

```bash
# Navigate to frontend
cd job-app

# Install dependencies
npm install

# Create .env file
# Add VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Run development server
npm run dev
```

📖 **Detailed frontend guide**: See [Job-App/README.md](./Job-App/README.md)

## 📋 Complete Setup Sequence

```bash
# 1. Backend
cd backend
npm install
# Create .env with PRIVATE_KEY and SEPOLIA_RPC_URL
npm run compile
npm run deploy:sepolia

# 2. Copy contract address from deployment output

# 3. Frontend
cd ..
cd job-app
npm install
# Create .env with VITE_CONTRACT_ADDRESS
npm run dev
```

## 🛠️ Technology Stack

### Backend
- **Hardhat**: Development environment for Ethereum
- **Solidity**: Smart contract language
- **FHEVM**: Zama's Fully Homomorphic Encryption Virtual Machine
- **TypeScript**: Type-safe development
- **Ethers.js**: Ethereum library

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and dev server
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Zama FHEVM SDK**: Client-side FHE operations

## 🔐 How It Works

### Encryption Flow

1. **Profile Creation**: User data (salary, experience, etc.) is encrypted using FHEVM before being sent to the blockchain
2. **On-Chain Storage**: Encrypted data is stored on-chain as `euint32` and `euint256` types
3. **Job Application**: Encrypted profile data is copied to job applications
4. **Evaluation**: Companies evaluate candidates using FHE operations without decrypting data
5. **Result Decryption**: Only eligible candidates can decrypt their evaluation results
6. **Contact Access**: Companies can decrypt contact information for eligible candidates only

### FHE Types Used

- `euint32`: Encrypted 32-bit integers (salary, experience, education, phone)
- `euint256`: Encrypted 256-bit integers (email encoding)
- `ebool`: Encrypted boolean (eligibility results)

## 📁 Project Structure

```
FHE Junction/
├── backend/
│   ├── contracts/
│   │   └── FHEJunction.sol      # Main smart contract
│   ├── deploy/
│   │   └── deploy_FHEJunction.ts # Deployment script
│   ├── tests/
│   │   └── FHEJunction.test.ts   # Contract tests
│   ├── hardhat.config.ts         # Hardhat configuration
│   └── README.md                  # Backend documentation
│
├── Job-App/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useZamaInstance.ts
│   │   │   ├── useFHEEncryption.ts
│   │   │   └── useContract.ts
│   │   ├── config/               # Configuration
│   │   └── abi/                  # Contract ABI
│   ├── vite.config.ts            # Vite configuration
│   └── README.md                 # Frontend documentation
│
└── README.md                     # This file
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                    # Run tests on local network
npm run test:sepolia        # Run tests on Sepolia
```

### Frontend Development

```bash
cd job-app
npm run dev                 # Development server
npm run type-check          # TypeScript checking
npm run build               # Production build
```

## 🌐 Network Configuration

- **Development**: Hardhat local network (chainId: 31337)
- **Testnet**: Sepolia (chainId: 11155111)

Make sure your wallet is connected to Sepolia when using the application.

## 📝 Environment Variables

### Backend (.env in `backend/`)

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_api_key
```

### Frontend (.env in `Job-App/`)

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

⚠️ **Never commit `.env` files to version control!**

## 🔒 Security Considerations

- **Private Keys**: Never share or commit private keys
- **Environment Variables**: Use `.env` files and add them to `.gitignore`
- **Network**: Currently deployed on Sepolia testnet (not mainnet)
- **FHE Security**: All sensitive operations use Zama FHEVM encryption
- **Wallet Security**: Users control their own wallets - no key storage in the app

## 🐛 Troubleshooting

### Backend Issues
- **Insufficient funds**: Get Sepolia ETH from a faucet
- **Deployment fails**: Check RPC URL and private key in `.env`
- See [backend/README.md](./backend/README.md) for detailed troubleshooting

### Frontend Issues
- **Contract not found**: Verify `VITE_CONTRACT_ADDRESS` in `.env`
- **FHEVM not initializing**: Check browser console, ensure Sepolia network
- **Too many requests**: Wait a few minutes, check for infinite loops
- See [Job-App/README.md](./Job-App/README.md) for detailed troubleshooting

## 📚 Documentation

- [Backend Deployment Guide](./backend/README.md) - Smart contract deployment
- [Frontend Setup Guide](./Job-App/README.md) - Frontend development and deployment
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm) - FHEVM documentation
- [Hardhat Docs](https://hardhat.org/docs) - Hardhat documentation
- [Wagmi Docs](https://wagmi.sh) - Wagmi React hooks documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project uses FHEVM by Zama. Check individual package licenses for details.

## 🙏 Acknowledgments

- **Zama**: For FHEVM and FHE technology
- **Hardhat**: For the development framework
- **Wagmi & RainbowKit**: For Web3 React integration

## 📞 Support

For issues or questions:
- Check the troubleshooting sections in backend/frontend READMEs
- Review browser console for frontend errors
- Check deployment logs for backend issues
- Consult Zama FHEVM documentation for FHE-specific questions

---

**Built with 🔐 FHEVM by Zama | Deployed on Sepolia Testnet**

