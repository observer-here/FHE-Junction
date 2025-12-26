import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useFHEEncryption } from '../hooks/useFHEEncryption';
import { CONTRACT_ADDRESS } from '../config/contract';
import { decodeEventLog } from 'viem';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';
import { decodeNumberToEmail } from '../utils/emailUtils';
import toast from 'react-hot-toast';

export default function EvaluateApplicants() {
  const { address } = useAccount();
  const { contract, readContract, publicClient } = useContract();
  const { decrypt } = useFHEEncryption();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedApplicants, setEvaluatedApplicants] = useState<string[]>([]);

  useEffect(() => {
    loadJobs();
  }, [readContract, address]);

  const loadJobs = async () => {
    if (!readContract || !address) return;
    try {
      const nextJobId = await readContract('nextJobId');
      const jobsList = [];
      
      for (let i = 0; i < Number(nextJobId); i++) {
        try {
          const jobResult = await readContract('jobs', BigInt(i));
          
          let job: any;
          if (Array.isArray(jobResult)) {
            job = {
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
            job = jobResult;
          }
          
          if (job.exists && job.company.toLowerCase() === address.toLowerCase()) {
            jobsList.push({ id: i, ...job });
          }
        } catch {
        }
      }
      
      setJobs(jobsList);
    } catch {
    }
  };

  const loadApplicants = async (jobId: number) => {
    if (!readContract || !publicClient) return;
    setLoading(true);
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'ApplicationSubmitted',
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

      const uniqueApplicants = new Set<string>();
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: FHE_JUNCTION_ABI,
            data: log.data,
            topics: log.topics,
          });
          const applicantAddr = (decoded.args as any).applicant;
          if (applicantAddr) {
            uniqueApplicants.add(applicantAddr);
          }
        } catch {
        }
      }

      const applicantsList = Array.from(uniqueApplicants);
      setApplicants(applicantsList);
      
      const evaluatedLogs = await publicClient.getLogs({
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

      if (evaluatedLogs.length > 0) {
        setEvaluatedApplicants(applicantsList);
      }
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateAll = async () => {
    if (!contract || selectedJobId === null || applicants.length === 0) return;
    setEvaluating(true);
    try {
      console.log('🔍 [FHE Evaluation] Starting evaluation process for job:', selectedJobId);
      console.log('👥 [FHE Evaluation] Number of applicants to evaluate:', applicants.length);
      console.log('⚙️ [FHE Evaluation] FHE operations will be performed on-chain:');
      console.log('  🔄 Comparing applicant salary <= job maxSalary (euint32)');
      console.log('  🔄 Comparing applicant experience >= job minExperience (euint32)');
      console.log('  🔄 Comparing applicant education >= job minEducation (euint32)');
      console.log('  🔄 Comparing applicant sex == job preferredSex (euint32)');
      console.log('  🧮 Computing eligibility (ebool) using FHE.and operations');
      console.log('🔐 [FHE Evaluation] All comparisons performed on encrypted data without decryption');
      
      const tx = await contract.evaluateAllApplicants(selectedJobId, applicants);
      console.log('⏳ [FHE Evaluation] Evaluation transaction submitted, waiting for confirmation...');
      await tx.wait();
      console.log('✅ [FHE Evaluation] Evaluation completed. Eligibility computed and stored (encrypted)');
      console.log('🔓 [FHE Evaluation] Contact info decryption permissions granted to eligible applicants and company');
      toast.success('All applicants evaluated successfully! Eligible applicants with contact information are now displayed.');
      setEvaluatedApplicants(applicants);
      await loadApplicants(selectedJobId);
    } catch (error: any) {
      toast.error(error?.reason || 'Failed to evaluate applicants');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="evaluate-applicants">
      <div className="evaluate-header">
      <h2>Evaluate Applicants</h2>
        <p className="evaluate-subtitle">Review and evaluate job applicants confidentially</p>
      </div>
      
      {jobs.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            No jobs posted yet
          </p>
          <p>Create a job posting to start receiving applications.</p>
        </div>
      ) : (
        <>
          <div className="job-selector-section">
            <h3>Select Job to Evaluate</h3>
      <div className="job-selector">
        {jobs.map((job) => (
            <button
                  key={job.id}
                  className={`job-select-btn ${selectedJobId === job.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedJobId(job.id);
                    setEvaluatedApplicants([]);
                loadApplicants(job.id);
              }}
            >
                  <span className="job-select-title">{job.title}</span>
                  <span className="job-select-meta">ID: {job.id}</span>
            </button>
              ))}
          </div>
      </div>

      {selectedJobId !== null && (
        <div className="applicants-section">
              <div className="applicants-header">
          <h3>Applicants</h3>
                {!loading && applicants.length > 0 && (
                  <span className="applicant-count">{applicants.length} {applicants.length === 1 ? 'Applicant' : 'Applicants'}</span>
                )}
              </div>
              
          {loading ? (
            <div className="loading">Loading applicants...</div>
          ) : applicants.length === 0 ? (
                <div className="empty-state">
                  <p style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    No applicants yet
                  </p>
                  <p>Applications will appear here once candidates apply for this job.</p>
                </div>
          ) : (
            <>
                  {evaluatedApplicants.length === 0 ? (
                    <div className="evaluate-action-section">
                      <button 
                        className="evaluate-all-btn" 
                        onClick={handleEvaluateAll} 
                        disabled={evaluating}
                      >
                {evaluating ? 'Evaluating...' : 'Evaluate All Applicants'}
              </button>
                      <p className="evaluate-hint">
                        💡 Click to evaluate all applicants. Only eligible candidates' contact information will be revealed.
                      </p>
                    </div>
                  ) : (
                    <>
              <div className="applicants-list">
                        {evaluatedApplicants.map((applicant) => (
                  <ApplicantCard
                    key={applicant}
                    jobId={selectedJobId}
                    applicantAddress={applicant}
                    readContract={readContract}
                    decrypt={decrypt}
                  />
                ))}
              </div>
                      <p className="evaluate-success">
                        ✅ Showing eligible applicants only. Contact information is displayed above.
                      </p>
                    </>
                  )}
            </>
          )}
        </div>
          )}
        </>
      )}
    </div>
  );
}

interface ApplicantCardProps {
  jobId: number;
  applicantAddress: string;
  readContract: any;
  decrypt: (value: any) => Promise<any>;
}

function ApplicantCard({
  jobId,
  applicantAddress,
  readContract,
  decrypt,
}: ApplicantCardProps) {
  const [application, setApplication] = useState<any>(null);
  const [eligibility, setEligibility] = useState<boolean | null>(null);
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [readContract, jobId, applicantAddress]);

  const loadApplication = async () => {
    if (!readContract) return;
    try {
      const appResult = await readContract('applications', BigInt(jobId), applicantAddress as `0x${string}`);
      
      let app: any;
      if (Array.isArray(appResult)) {
        app = {
          salary: appResult[0],
          experience: appResult[1],
          education: appResult[2],
          sex: appResult[3],
          profileVersion: appResult[4],
          contactEmail: appResult[5],
          contactPhone: appResult[6],
          eligible: appResult[7],
          evaluated: appResult[8],
          applied: appResult[9],
        };
      } else {
        app = appResult;
      }
      
      setApplication(app);
    } catch {
    }
  };

  if (!application?.applied) {
    return null;
  }

  if (!application.evaluated) {
    return null;
  }

  if (eligibility === null) {
  return (
    <div className="applicant-card">
        <div className="applicant-card-content">
          <div className="applicant-address">
            <span className="address-label">EVM Address:</span>
            <span className="address-value">{applicantAddress}</span>
          </div>
          <p className="decrypt-hint">Click to decrypt eligibility status</p>
        </div>
              <button 
          className="decrypt-btn"
                onClick={async () => {
                  setLoading(true);
                  try {
                    console.log('🔓 [Decryption] Decrypting eligibility status...');
                    const result = await decrypt(application.eligible);
              const isEligible = result === 1 || result === true;
              console.log('✅ [Decryption] Eligibility decrypted:', isEligible);
              setEligibility(isEligible);
              
                    if (isEligible) {
                      try {
                        console.log('🎯 [Decryption] Applicant is eligible. Decrypting contact information...');
                        console.log('🔓 [Decryption] Decrypting contact email (euint256)...');
                        const emailNumber = await decrypt(application.contactEmail);
                        console.log('✅ [Decryption] Email number decrypted:', emailNumber);
                        
                        console.log('🔓 [Decryption] Decrypting contact phone (euint32)...');
                        const phoneNumber = await decrypt(application.contactPhone);
                        console.log('✅ [Decryption] Phone number decrypted:', phoneNumber);
                        
                        const email = decodeNumberToEmail(BigInt(emailNumber));
                        const phoneStr = phoneNumber.toString();
                        const last10 = phoneStr.slice(-10);
                        const phoneDisplay = phoneStr.length > 10 ? `+xx ${last10}` : phoneStr;
                        
                        console.log('📊 [Decryption] Contact information decrypted:');
                        console.log('  📧 Email:', email);
                        console.log('  📱 Phone:', phoneDisplay);
                        
                        setContactEmail(email);
                        setContactPhone(phoneDisplay);
                      } catch {
                        console.error('❌ [Decryption] Failed to decrypt contact information');
                        toast.error('Failed to decrypt contact information');
                      }
                    }
            } catch {
              console.error('❌ [Decryption] Failed to decrypt eligibility');
              toast.error('Failed to decrypt. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }} 
                disabled={loading}
              >
                {loading ? 'Decrypting...' : 'Decrypt Eligibility'}
              </button>
            </div>
    );
  }

  return (
    <div className={`applicant-card ${eligibility ? 'eligible-card' : 'ineligible-card'}`}>
      <div className="applicant-card-content">
        <div className="applicant-header">
          <div className="applicant-address">
            <span className="address-label">EVM Address:</span>
            <span className="address-value">{applicantAddress}</span>
          </div>
          {eligibility ? (
            <span className="eligible-badge">✅ Eligible</span>
          ) : (
            <span className="ineligible-badge">❌ Not Eligible</span>
          )}
        </div>
              {eligibility && (
          <div className="contact-info">
            {contactEmail && (
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div className="contact-details">
                  <span className="contact-label">Email:</span>
                  <span className="contact-value">{contactEmail}</span>
                </div>
                </div>
              )}
            {contactPhone && (
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div className="contact-details">
                  <span className="contact-label">Phone:</span>
                  <span className="contact-value">{contactPhone}</span>
                </div>
              </div>
          )}
          </div>
      )}
      </div>
    </div>
  );
}

