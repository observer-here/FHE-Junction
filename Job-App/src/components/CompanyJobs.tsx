import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { WorkPreference, PrimaryField } from '../types';
import { CONTRACT_ADDRESS } from '../config/contract';
import { decodeEventLog } from 'viem';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';

interface CompanyJobsProps {
  companyAddress: string;
  setCurrentView: (view: string) => void;
}

export default function CompanyJobs({ companyAddress, setCurrentView }: CompanyJobsProps) {
  const { address } = useAccount();
  const { readContract, publicClient } = useContract();
  const [jobs, setJobs] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWorkPreference, setFilterWorkPreference] = useState<number | ''>('');
  const [filterPrimaryField, setFilterPrimaryField] = useState<number | ''>('');

  useEffect(() => {
    if (address && publicClient) {
      loadCompanyInfo();
      loadJobs();
    }
  }, [address, companyAddress, publicClient]);

  const loadCompanyInfo = async () => {
    if (!readContract) return;
    try {
      const profileResult = await readContract('companies', companyAddress as `0x${string}`);
      
      let profile: any;
      if (Array.isArray(profileResult)) {
        profile = {
          name: profileResult[0],
          industry: profileResult[1],
          website: profileResult[2],
          contactEmail: profileResult[3],
          location: profileResult[4],
          owner: profileResult[5],
          exists: profileResult[6],
        };
      } else {
        profile = profileResult;
      }
      
      if (profile && profile.exists) {
        setCompanyName(profile.name);
      }
    } catch {
    }
  };

  const countApplicants = async (jobId: number): Promise<number> => {
    if (!publicClient) return 0;
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
            uniqueApplicants.add(applicantAddr.toLowerCase());
          }
        } catch {
        }
      }
      return uniqueApplicants.size;
    } catch {
      return 0;
    }
  };

  const loadJobs = async () => {
    if (!readContract || !address || !publicClient) return;
    setLoading(true);
    try {
      const nextJobId = await readContract('nextJobId');
      const jobsList = [];
      const now = Math.floor(Date.now() / 1000);
      
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
          
          if (job.exists && job.company.toLowerCase() === companyAddress.toLowerCase()) {
            const deadline = Number(job.applicationDeadline);
            const isDeadlineCrossed = deadline <= now;
            
            let hasApplied = false;
            let isEvaluated = false;
            try {
              const appResult = await readContract('applications', BigInt(i), address as `0x${string}`);
              if (Array.isArray(appResult)) {
                hasApplied = appResult[9] === true;
                isEvaluated = appResult[8] === true;
              } else if (appResult && typeof appResult === 'object' && 'applied' in appResult) {
                hasApplied = (appResult as any).applied === true;
                isEvaluated = (appResult as any).evaluated === true;
              }
            } catch {
              hasApplied = false;
              isEvaluated = false;
            }
            
            // Count applicants
            const applicantCount = await countApplicants(i);
            
            // Show ALL jobs (including past deadline and evaluated)
            jobsList.push({ 
              id: i, 
              ...job, 
              hasApplied,
              isEvaluated,
              deadlineTimestamp: deadline,
              isDeadlineCrossed,
              applicantCount
            });
          }
        } catch {
        }
      }
      
      setJobs(jobsList);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId: number) => {
    setCurrentView(`apply-${jobId}`);
  };

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = !searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = !filterLocation || job.location.toLowerCase().includes(filterLocation.toLowerCase());
      const matchesWorkPreference = filterWorkPreference === '' || job.workPreference === filterWorkPreference;
      const matchesPrimaryField = filterPrimaryField === '' || job.primaryField === filterPrimaryField;
      
      return matchesSearch && matchesLocation && matchesWorkPreference && matchesPrimaryField;
    });
    
    // Sort by priority: deadline closer, not evaluated yet, applied, evaluated, deadline crossed
    return filtered.sort((a, b) => {
      // Priority 1: Deadline crossed goes to the end
      if (a.isDeadlineCrossed !== b.isDeadlineCrossed) {
        return a.isDeadlineCrossed ? 1 : -1;
      }
      
      // For active jobs (not crossed), sort by deadline first
      if (!a.isDeadlineCrossed && !b.isDeadlineCrossed) {
        // Priority 2: Deadline (sooner first)
        if (a.deadlineTimestamp !== b.deadlineTimestamp) {
          return a.deadlineTimestamp - b.deadlineTimestamp;
        }
        
        // Priority 3: Not evaluated yet comes first
        const aNotEvaluated = !a.isEvaluated;
        const bNotEvaluated = !b.isEvaluated;
        if (aNotEvaluated !== bNotEvaluated) {
          return aNotEvaluated ? -1 : 1;
        }
        
        // Priority 4: Applied comes before not applied
        if (a.hasApplied !== b.hasApplied) {
          return a.hasApplied ? -1 : 1;
        }
        
        // Priority 5: If both applied, evaluated comes after not evaluated
        if (a.hasApplied && b.hasApplied && a.isEvaluated !== b.isEvaluated) {
          return a.isEvaluated ? 1 : -1;
        }
      }
      
      // Priority 6: Job ID (lower first)
      return a.id - b.id;
    });
  }, [jobs, searchQuery, filterLocation, filterWorkPreference, filterPrimaryField]);

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="company-jobs">
      <div className="content-header">
        <div>
          <button 
            onClick={() => setCurrentView('companies')}
            className="back-btn"
            style={{ marginBottom: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            ← Back to Companies
          </button>
          <h2>{companyName || 'Company'} Jobs</h2>
        </div>
        <button onClick={loadJobs} disabled={loading} className="refresh-btn">
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="search-filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search jobs by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters-row">
          <input
            type="text"
            placeholder="Filter by location..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="filter-input"
          />
          
          <select
            value={filterWorkPreference}
            onChange={(e) => setFilterWorkPreference(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="filter-select"
          >
            <option value="">All Work Preferences</option>
            <option value={WorkPreference.Remote}>Remote</option>
            <option value={WorkPreference.Hybrid}>Hybrid</option>
            <option value={WorkPreference.OnSite}>On-Site</option>
          </select>
          
          <select
            value={filterPrimaryField}
            onChange={(e) => setFilterPrimaryField(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="filter-select"
          >
            <option value="">All Fields</option>
            <option value={PrimaryField.Software}>Software</option>
            <option value={PrimaryField.Banking}>Banking</option>
            <option value={PrimaryField.AI}>AI</option>
            <option value={PrimaryField.Web3}>Web3</option>
            <option value={PrimaryField.Other}>Other</option>
          </select>
          
          {(searchQuery || filterLocation || filterWorkPreference !== '' || filterPrimaryField !== '') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterLocation('');
                setFilterWorkPreference('');
                setFilterPrimaryField('');
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {jobs.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            No active jobs from this company
          </p>
          <p style={{ marginBottom: '1.5rem' }}>Check back later for new opportunities!</p>
          <button onClick={() => setCurrentView('companies')}>Back to Companies</button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            No jobs match your filters
          </p>
          <button onClick={() => {
            setSearchQuery('');
            setFilterLocation('');
            setFilterWorkPreference('');
            setFilterPrimaryField('');
          }}>Clear Filters</button>
        </div>
      ) : (
      <div className="jobs-list">
        {filteredJobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-card-content">
            <h3>{job.title}</h3>
              <p><strong>Location:</strong> {job.location} | <strong>Work Preference:</strong> {job.workPreference === 0 ? 'Remote' : job.workPreference === 1 ? 'Hybrid' : 'On-Site'} | <strong>Primary Field:</strong> {job.primaryField === 0 ? 'Software' : job.primaryField === 1 ? 'Banking' : job.primaryField === 2 ? 'AI' : job.primaryField === 3 ? 'Web3' : 'Other'}</p>
            <p>
              <strong>Deadline:</strong> {new Date(Number(job.applicationDeadline) * 1000).toLocaleString()}
              {job.isDeadlineCrossed && (
                <span style={{ color: 'var(--error-color)', marginLeft: '0.5rem', fontWeight: '600' }}>
                  (Expired)
                </span>
              )}
            </p>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              <strong>Vacancies:</strong> {job.vacancyCount || 0} | <strong>Applicants:</strong> {job.applicantCount || 0}
            </p>
            {job.hasApplied && (
              <p style={{ color: 'var(--primary-color)', fontWeight: '600', marginTop: '0.5rem' }}>
                ✓ Applied {job.isEvaluated && '(Evaluated)'}
              </p>
            )}
            </div>
            <button 
              onClick={() => handleApply(job.id)}
              disabled={job.hasApplied || job.isDeadlineCrossed}
              style={(job.hasApplied || job.isDeadlineCrossed) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {job.isDeadlineCrossed ? 'Expired' : job.hasApplied ? 'Already Applied' : 'View Details & Apply'}
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

