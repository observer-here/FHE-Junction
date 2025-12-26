import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useActiveRole } from '../hooks/useActiveRole';
import { CONTRACT_ADDRESS } from '../config/contract';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';
import { decodeErrorResult } from 'viem';
import toast from 'react-hot-toast';

interface JobAppProps {
  jobId: number;
  setCurrentView: (view: string) => void;
}

export default function JobApp({ jobId, setCurrentView }: JobAppProps) {
  const { address } = useAccount();
  const { contract, readContract, publicClient } = useContract();
  const { hasIndividual } = useActiveRole();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [jobHasBeenEvaluated, setJobHasBeenEvaluated] = useState(false);

  useEffect(() => {
    if (address && publicClient) {
    loadJob();
      checkApplicationStatus();
      checkIfJobEvaluated();
    }
  }, [jobId, address, publicClient]);

  const loadJob = async () => {
    if (!readContract) return;
    try {
      const jobResult = await readContract('jobs', BigInt(jobId));
      
      let jobData: any;
      if (Array.isArray(jobResult)) {
        jobData = {
          company: jobResult[0],
          title: jobResult[1],
          location: jobResult[2],
          workPreference: jobResult[3],
          primaryField: jobResult[4],
          maxSalary: jobResult[5],
          minExperience: jobResult[6],
          minEducation: jobResult[7],
          preferredSex: jobResult[8],
          applicationDeadline: jobResult[9],
          vacancyCount: jobResult[10],
          exists: jobResult[11],
        };
      } else {
        jobData = jobResult;
      }
      
      setJob(jobData);
    } catch {
    }
  };

  const checkApplicationStatus = async () => {
    if (!readContract || !address) return;
    try {
      const appResult = await readContract('applications', BigInt(jobId), address as `0x${string}`);
      if (Array.isArray(appResult)) {
        setHasApplied(appResult[9] === true);
        setIsEvaluated(appResult[8] === true);
      } else if (appResult && typeof appResult === 'object' && 'applied' in appResult) {
        setHasApplied((appResult as any).applied === true);
        setIsEvaluated((appResult as any).evaluated === true);
      }
    } catch {
      setHasApplied(false);
      setIsEvaluated(false);
    }
  };

  const checkIfJobEvaluated = async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'ApplicantEvaluated',
          inputs: [
            { type: 'uint256', indexed: true, name: 'jobId' },
            { type: 'address', indexed: true, name: 'applicant' },
          ],
        } as any,
        args: {
          jobId: BigInt(jobId),
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      setJobHasBeenEvaluated(logs.length > 0);
    } catch {
      setJobHasBeenEvaluated(false);
    }
  };

  const handleApply = async () => {
    if (!contract || !address || !job || !readContract) return;
    
    if (!hasIndividual) {
      toast.error('Please create an individual profile first.');
      setCurrentView('profile');
      return;
    }
    
    try {
      const profileResult = await readContract('individuals', address as `0x${string}`);
      let profileExists = false;
      if (Array.isArray(profileResult)) {
        profileExists = profileResult[7] === true;
      } else if (profileResult && typeof profileResult === 'object' && 'exists' in profileResult) {
        profileExists = (profileResult as any).exists === true;
      }
      
      if (!profileExists) {
        toast.error('Please create your profile first.');
        setCurrentView('profile');
        return;
      }
    } catch {
      toast.error('Unable to verify profile. Please try again.');
      return;
    }
    
    if (hasApplied) {
      toast.error('You have already applied for this job.');
      return;
    }
    
    if (isEvaluated || jobHasBeenEvaluated) {
      toast.error('This job has already been evaluated. Applications are closed.');
      return;
    }
    
      const deadline = Number(job.applicationDeadline);
      const now = Math.floor(Date.now() / 1000);
      if (deadline <= now) {
      toast.error('Sorry, the application deadline has passed.');
        return;
      }

    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      console.log('📤 [FHE Application] Submitting application for job:', jobId);
      console.log('🔐 [FHE Application] Application will use encrypted profile data:');
      console.log('  📝 Expected Salary (euint32)');
      console.log('  📝 Experience (euint32)');
      console.log('  📝 Education (euint32)');
      console.log('  📝 Sex (euint32)');
      console.log('  📝 Contact Email (euint256)');
      console.log('  📝 Contact Phone (euint32)');
      console.log('🔄 [FHE Application] Encrypted data copied from profile to application');
      
      const tx = await contract.applyForJob(jobId);
      console.log('⏳ [FHE Application] Application transaction submitted, waiting for confirmation...');
      await tx.wait();
      console.log('✅ [FHE Application] Application submitted successfully. Encrypted data stored on-chain');
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setCurrentView('my-applications');
    } catch (error: any) {
      let errorMessage = 'Failed to apply. Please try again.';
      
      try {
        if (error?.data || error?.error?.data) {
          const errorData = error?.data || error?.error?.data;
          if (typeof errorData === 'string' && errorData.startsWith('0x')) {
            try {
              const decoded = decodeErrorResult({
                abi: FHE_JUNCTION_ABI,
                data: errorData as `0x${string}`,
              });
              errorMessage = decoded.errorName || errorMessage;
            } catch {
            }
          }
        }
      } catch {
      }
      
      if (error?.reason) {
        errorMessage = error.reason;
      } else if (error?.error?.reason) {
        errorMessage = error.error.reason;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('individual profile required') || errorLower.includes('profile required')) {
        errorMessage = 'Please create an individual profile first.';
        setCurrentView('profile');
      } else if (errorLower.includes('already applied')) {
        errorMessage = 'You have already applied for this job.';
        setHasApplied(true);
      } else if (errorLower.includes('applications closed') || errorLower.includes('deadline')) {
        errorMessage = 'The application deadline has passed.';
      } else if (errorLower.includes('job not found')) {
        errorMessage = 'This job no longer exists.';
      } else if (errorLower.includes('execution reverted')) {
        if (error?.data?.originalError?.reason) {
          errorMessage = error.data.originalError.reason;
        } else if (error?.error?.data?.originalError?.reason) {
          errorMessage = error.error.data.originalError.reason;
        } else {
          errorMessage = 'Transaction failed. Please check your profile and try again.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return <div className="loading">Loading job details...</div>;
  }

  return (
    <div className="job-app">
      <h2>{job.title}</h2>
      <div className="job-details">
        <p><strong>Location:</strong> {job.location}</p>
        <p><strong>Work Preference:</strong> {job.workPreference === 0 ? 'Remote' : job.workPreference === 1 ? 'Hybrid' : 'On-Site'}</p>
        <p><strong>Primary Field:</strong> {job.primaryField === 0 ? 'Software' : job.primaryField === 1 ? 'Banking' : job.primaryField === 2 ? 'AI' : job.primaryField === 3 ? 'Web3' : 'Other'}</p>
        <p><strong>Application Deadline:</strong> {new Date(Number(job.applicationDeadline) * 1000).toLocaleString()}</p>
        <p className="encrypted-notice">💰 Salary, experience, and education requirements are encrypted and confidential</p>
      </div>
      
      {hasApplied ? (
        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'var(--primary-color)', fontWeight: '600', margin: 0 }}>
            ✓ You have already applied for this job
          </p>
          <button 
            onClick={() => setCurrentView('my-applications')}
            style={{ marginTop: '0.75rem' }}
          >
            View My Applications
          </button>
        </div>
      ) : (isEvaluated || jobHasBeenEvaluated) ? (
        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'var(--error-color)', fontWeight: '600', margin: 0 }}>
            Applications are closed - this job has been evaluated
          </p>
        </div>
      ) : (
        <button onClick={handleApply} disabled={loading || !hasIndividual || isEvaluated || jobHasBeenEvaluated}>
          {loading ? 'Applying...' : !hasIndividual ? 'Create Profile First' : (isEvaluated || jobHasBeenEvaluated) ? 'Applications Closed' : 'Apply Privately'}
      </button>
      )}
    </div>
  );
}

