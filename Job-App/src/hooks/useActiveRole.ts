import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from './useContract';
import { Role } from '../types';

export function useActiveRole() {
  const { address, isConnected } = useAccount();
  const { readContract } = useContract();
  const [hasIndividual, setHasIndividual] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [activeMode, setActiveMode] = useState<Role>(Role.None);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setHasIndividual(false);
      setHasCompany(false);
      setActiveMode(Role.None);
      setLoading(false);
      return;
    }

    if (!readContract) {
      return;
    }

    let cancelled = false;

    const checkProfiles = async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const individualResult = await readContract('individuals', address as `0x${string}`);
        const companyResult = await readContract('companies', address as `0x${string}`);
        
        if (cancelled) return;
        
        const individualExists = Array.isArray(individualResult) 
          ? individualResult[7] 
          : (individualResult && typeof individualResult === 'object' && 'exists' in individualResult)
          ? (individualResult as any).exists
          : false;
        const companyExists = Array.isArray(companyResult)
          ? companyResult[6]
          : (companyResult && typeof companyResult === 'object' && 'exists' in companyResult)
          ? (companyResult as any).exists
          : false;

        if (cancelled) return;

        setHasIndividual(individualExists);
        setHasCompany(companyExists);

        if (individualExists && !companyExists) {
          setActiveMode(Role.Individual);
        } else if (companyExists && !individualExists) {
          setActiveMode(Role.Company);
        } else if (individualExists && companyExists) {
          setActiveMode((prev) => {
            if (prev === Role.Company || prev === Role.Individual) {
              return prev;
            }
            return Role.Individual;
          });
        } else {
          setActiveMode(Role.None);
        }
      } catch {
        if (cancelled) return;
        setHasIndividual(false);
        setHasCompany(false);
        setActiveMode(Role.None);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkProfiles();

    const handleRoleSwitch = () => {
      if (!cancelled) {
        checkProfiles();
      }
    };

    window.addEventListener('roleSwitched', handleRoleSwitch);
    return () => {
      cancelled = true;
      window.removeEventListener('roleSwitched', handleRoleSwitch);
    };
  }, [address, isConnected]);

  const switchMode = (mode: Role) => {
    if (mode === Role.Individual && hasIndividual) {
      setActiveMode(Role.Individual);
    } else if (mode === Role.Company && hasCompany) {
      setActiveMode(Role.Company);
    }
  };

  return {
    activeMode,
    hasIndividual,
    hasCompany,
    loading,
    switchMode,
  };
}

