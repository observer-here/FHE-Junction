import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

const infuraRpc = http('https://sepolia.infura.io/v3/e8f8a5e83dc34b9babbd6654c105372f', {
  retryCount: 2,
  retryDelay: 1000,
});

const publicRpc1 = http('https://rpc.sepolia.org', {
  retryCount: 1,
  retryDelay: 500,
});

const publicRpc2 = http('https://sepolia.gateway.tenderly.co', {
  retryCount: 1,
  retryDelay: 500,
});

export const config = getDefaultConfig({
  appName: 'FHE Junction',
  projectId: '3a6a8fa111f53dafc59e15f6ea7f22e4',
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback([infuraRpc, publicRpc1, publicRpc2], {
      rank: false,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: false,
});

