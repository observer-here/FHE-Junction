import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Contract, BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESS } from '../config/contract';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';

export function useContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (!walletClient) {
      setContract(null);
      return;
    }

    const createContract = async () => {
      try {
        const provider = new BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        const contractInstance = new Contract(CONTRACT_ADDRESS, FHE_JUNCTION_ABI, signer);
        setContract(contractInstance);
      } catch {
        setContract(null);
      }
    };

    createContract();
  }, [walletClient]);

  const readContractFn = useCallback(async (functionName: string, ...args: any[]) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    return publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FHE_JUNCTION_ABI,
      functionName: functionName as any,
      args: args as any,
    });
  }, [publicClient]);

  return { 
    contract, 
    readContract: readContractFn, 
    publicClient 
  };
}

