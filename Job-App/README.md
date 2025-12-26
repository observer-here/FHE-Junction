# FHE Junction - Frontend Setup Guide

This guide will help you set up and run the FHE Junction frontend application.

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- A deployed FHEJunction contract address (from backend deployment)
- A Web3 wallet (MetaMask, WalletConnect, etc.)

## Step 1: Environment Setup

1. Navigate to the frontend directory:

```bash
cd job-app
```

2. Create a `.env` file in the `job-app` directory:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**Important Notes:**
- Replace `0xYourDeployedContractAddress` with the contract address from backend deployment
- The address must start with `0x`
- Get the contract address from `backend/deployments/sepolia/FHEJunction.json` or from the deployment console output

**Example:**
```env
VITE_CONTRACT_ADDRESS=0x86829234600E3c77CB2a0B3BB28dD58F7fe4e8A8
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including React, Vite, Wagmi, RainbowKit, and FHEVM SDK.

## Step 3: Development Mode

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

**Features in development mode:**
- Hot module replacement (HMR)
- Fast refresh
- Source maps for debugging

## Step 4: Build for Production

Build the optimized production bundle:

```bash
npm run build
```

This will:
- Type-check TypeScript code
- Compile and optimize the React app
- Generate production-ready files in the `dist` folder
- Create optimized chunks for better loading performance

**Output:** The `dist` folder contains all static files ready for deployment.

## Step 5: Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

This serves the `dist` folder locally so you can test the production build before deploying.

## Complete Setup Commands

Here's the complete setup sequence:

```bash
# Navigate to frontend directory
cd job-app

# Install dependencies
npm install

# Create .env file with VITE_CONTRACT_ADDRESS

# Development mode
npm run dev

# OR build for production
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Lint code with ESLint
- `npm run type-check` - Type-check TypeScript without building

## Project Structure

```
job-app/
├── src/
│   ├── components/      # React components
│   │   ├── App.tsx      # Main app component
│   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   ├── Profile.tsx  # Individual profile
│   │   ├── JobManager.tsx # Company job creation
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useZamaInstance.ts    # FHEVM initialization
│   │   ├── useFHEEncryption.ts    # FHE encryption/decryption
│   │   ├── useActiveRole.ts      # Role management
│   │   └── useContract.ts        # Contract interactions
│   ├── config/          # Configuration files
│   │   ├── contract.ts # Contract address
│   │   └── wagmi.ts    # Wagmi configuration
│   ├── abi/            # Contract ABI
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
├── dist/               # Production build output
├── .env                # Environment variables (create this)
└── vite.config.ts      # Vite configuration
```

## Features

### Individual Mode
- Create and update encrypted profile (salary, experience, education, sex, contact info)
- Browse job market
- Apply for jobs with encrypted data
- View application status and eligibility
- Decrypt eligibility results after evaluation

### Company Mode
- Create and update company profile
- Post job listings with encrypted requirements
- View applicants for your jobs
- Evaluate applicants using FHE (Fully Homomorphic Encryption)
- View decrypted contact information for eligible candidates

### Security Features
- All sensitive data encrypted using Zama FHEVM
- Private data remains encrypted on-chain
- Decryption only possible by authorized parties
- No data leaks - everything encrypted end-to-end

## Troubleshooting

### "Contract not found" error
- Verify `VITE_CONTRACT_ADDRESS` in `.env` is correct
- Ensure the address starts with `0x`
- Check that the contract is deployed on Sepolia
- Rebuild after changing `.env`: `npm run build`

### "FHEVM not initialized" error
- Wait for FHEVM to initialize (check console logs)
- Ensure you're connected to Sepolia network
- Check browser console for detailed error messages

### "Too Many Requests" error
- This happens when making excessive RPC calls
- Wait a few minutes and try again
- Check that `readContract` is not in `useEffect` dependencies

### Build errors
- Run `npm run type-check` to see TypeScript errors
- Ensure all dependencies are installed: `npm install`
- Clear cache and rebuild: `rm -rf node_modules dist && npm install && npm run build`

### Wallet connection issues
- Ensure MetaMask or another Web3 wallet is installed
- Switch to Sepolia network in your wallet
- Refresh the page and try connecting again

### CORS/COOP errors
- These are expected warnings for FHEVM compatibility
- The app is configured to work with these headers
- If issues persist, check `vite.config.ts` server headers

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONTRACT_ADDRESS` | Deployed FHEJunction contract address | Yes |

## Network Configuration

The frontend is configured to work with:
- **Sepolia Testnet** (chainId: 11155111)

Make sure your wallet is connected to Sepolia when using the app.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add `VITE_CONTRACT_ADDRESS` in Vercel environment variables

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Add `VITE_CONTRACT_ADDRESS` in Netlify environment variables

### Deploy to GitHub Pages

1. Update `vite.config.ts` with `base: '/your-repo-name/'`
2. Build: `npm run build`
3. Deploy `dist` folder contents to `gh-pages` branch

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have FHEVM limitations)

**Note:** FHEVM requires SharedArrayBuffer support, which may not work in all browsers or require specific headers.

## Security Notes

⚠️ **Important Security Considerations:**

- Never commit `.env` file with real contract addresses to public repos
- Use environment variables for sensitive configuration
- The app uses FHE (Fully Homomorphic Encryption) - data is encrypted on-chain
- Private keys are never stored or transmitted by the frontend
- All wallet operations require user approval

## Support

For issues related to:
- **Frontend**: Check browser console for errors
- **FHEVM/Zama**: Check [Zama documentation](https://docs.zama.ai/fhevm)
- **Wagmi/RainbowKit**: Check [Wagmi docs](https://wagmi.sh) and [RainbowKit docs](https://rainbowkit.com)
- **Vite**: Check [Vite documentation](https://vitejs.dev)

## Development Tips

1. **Check console logs**: The app includes detailed console logs for FHE operations
2. **Use React DevTools**: Install React DevTools extension for debugging
3. **Network tab**: Monitor RPC calls in browser DevTools
4. **Type checking**: Run `npm run type-check` before committing

## License

This project uses FHEVM by Zama. Check license files for details.

