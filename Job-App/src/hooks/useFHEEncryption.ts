import { useCallback } from 'react';
import { useZamaInstance } from './useZamaInstance';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS } from '../config/contract';

export function useFHEEncryption() {
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const createEncryptedInput = useCallback(
    async (values32Before256: number[], value256: bigint | null, values32After256: number[]) => {
      if (!instance || !address) {
        console.error('❌ [Encryption] Zama instance or wallet not initialized');
        throw new Error('Zama instance or wallet not initialized');
      }
      console.log('✅ [Encryption] Zama FHEVM instance ready, starting encryption...');

      try {
      console.log('🔐 [Encryption] Starting encryption process...');
      console.log('📍 [Encryption] Contract address:', CONTRACT_ADDRESS);
      console.log('👤 [Encryption] User address:', address);
      console.log('📝 [Encryption] Values to encrypt:');
      console.log('  📊 euint32 values (before euint256):', values32Before256);
      if (value256 !== null) {
        console.log('  📊 euint256 value:', value256.toString());
      }
      console.log('  📊 euint32 values (after euint256):', values32After256);
        
        const builder = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
        
        values32Before256.forEach((val, index) => {
          if (val === undefined || val === null || isNaN(val)) {
            throw new Error(`Invalid value32: ${val}`);
          }
          console.log(`  ➕ [Encryption] Adding euint32[${index}]:`, val);
          builder.add32(Number(val));
        });
        
        if (value256 !== null && value256 !== undefined && value256 !== BigInt(0)) {
          console.log('  ➕ [Encryption] Adding euint256:', value256.toString());
          builder.add256(value256);
        }
        
        values32After256.forEach((val, index) => {
          if (val === undefined || val === null || isNaN(val)) {
            throw new Error(`Invalid value32: ${val}`);
          }
          const indexOffset = value256 !== null && value256 !== undefined && value256 !== BigInt(0) ? values32Before256.length + 1 : values32Before256.length;
          console.log(`  ➕ [Encryption] Adding euint32[${indexOffset + index}]:`, val);
          builder.add32(Number(val));
        });
        
        console.log('🔄 [Encryption] Encrypting all values...');
        const encrypted = await builder.encrypt();
        console.log('✅ [Encryption] Encryption completed successfully');

        if (!encrypted || !encrypted.handles || encrypted.handles.length === 0) {
          throw new Error('Encryption returned no handles');
        }

        const handlesAsHex = encrypted.handles.map((handle: Uint8Array) => {
          return `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
        });

        const expectedHandles = values32Before256.length + values32After256.length + (value256 !== null && value256 !== undefined && value256 !== BigInt(0) ? 1 : 0);
        if (handlesAsHex.length !== expectedHandles) {
          throw new Error(`Expected ${expectedHandles} handles, got ${handlesAsHex.length}`);
        }

        return {
          handles: handlesAsHex,
          inputProof: encrypted.inputProof,
        };
      } catch (error: any) {
        console.error('Encryption error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Failed to create encrypted input: ${error?.message || JSON.stringify(error)}`);
      }
    },
    [instance, address]
  );

  const decrypt = useCallback(
    async (encryptedValue: any) => {
      if (!instance || !address || !walletClient) {
        console.error('❌ [Decryption] Zama instance, wallet, or signer not initialized');
        throw new Error('Zama instance, wallet, or signer not initialized');
      }
      console.log('✅ [Decryption] Zama FHEVM instance ready, starting decryption...');

      try {
        let handleHex: string;
        
        if (typeof encryptedValue === 'string') {
          handleHex = encryptedValue.startsWith('0x') ? encryptedValue : `0x${encryptedValue}`;
        } else if (encryptedValue instanceof Uint8Array) {
          handleHex = `0x${Array.from(encryptedValue).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        } else {
          throw new Error(`Invalid encrypted value format: ${typeof encryptedValue}`);
        }

        const hex = handleHex.replace('0x', '');
        const handle = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);

        if (handle.length !== 32) {
          throw new Error(`Invalid handle length: expected 32 bytes, got ${handle.length}`);
        }

        console.log('🔑 [Decryption] Generating keypair for user decryption...');
        const keypair = instance.generateKeypair();
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "30";
        const contractAddresses = [CONTRACT_ADDRESS];

        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );

        const accounts = await walletClient.getAddresses();
        const account = accounts[0];
        
        const signature = await walletClient.signTypedData({
          domain: eip712.domain,
          types: {
            UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
          },
          primaryType: 'UserDecryptRequestVerification',
          message: eip712.message,
        });

        const handleContractPairs = [
          {
            handle: handle,
            contractAddress: CONTRACT_ADDRESS,
          },
        ];

        console.log('📡 [Decryption] Requesting user decryption from relayer...');
        const result = await instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          account,
          startTimestamp,
          durationDays
        );

        const decrypted = result[handleHex as `0x${string}`];
    
        if (decrypted === undefined) {
          console.error('❌ [Decryption] User decryption failed: No value returned');
          throw new Error(`Decryption failed: No value returned for handle ${handleHex}`);
        }
        
        console.log('✅ [Decryption] User decryption successful. Decrypted value:', decrypted);
        return decrypted;
      } catch (error: any) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Decryption failed');
      }
    },
    [instance, address, walletClient]
  );

  return {
    createEncryptedInput,
    decrypt,
    isReady: !!instance && !!address,
  };
}
