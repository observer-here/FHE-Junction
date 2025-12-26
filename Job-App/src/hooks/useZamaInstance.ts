import { useEffect, useState } from 'react';

type FhevmInstance = any;

let fhevmInstance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

export function initializeFHEVM() {
  if (fhevmInstance) {
    return Promise.resolve(fhevmInstance);
  }

  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      console.log('🚀 Installing FHEVM Zama...');
      const sdk = (window as any).RelayerSDK || (window as any).relayerSDK;
      
      if (!sdk) {
        throw new Error('RelayerSDK not loaded. Please ensure the CDN script is included in index.html');
      }
      
      const { initSDK, createInstance, SepoliaConfig } = sdk;
      
      await initSDK();
      
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please install MetaMask.');
      }
      
      const config = { 
        ...SepoliaConfig, 
        network: window.ethereum,
        gatewayUrl: 'https://gateway.sepolia.zama.dev'
      };
      
      const inst = await createInstance(config);
      
      fhevmInstance = inst;
      console.log('✅ Ready FHEVM Zama');
      return inst;
    } catch (err) {
      console.error('❌ FHEVM Zama installation error:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export function useZamaInstance() {
  const [instance, setInstance] = useState<FhevmInstance | null>(fhevmInstance);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (fhevmInstance) {
      setInstance(fhevmInstance);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);

    const promise = initPromise || initializeFHEVM();
    
    promise
      .then((inst) => {
        setInstance(inst);
        setIsInitializing(false);
      })
      .catch((err) => {
        console.error('❌ Failed to initialize FHEVM Zama:', err);
        setIsInitializing(false);
      });
  }, []);

  return { 
    instance, 
    isInitializing, 
    isReady: !!instance && !isInitializing,
  };
}
