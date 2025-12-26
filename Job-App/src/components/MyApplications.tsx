import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useFHEEncryption } from '../hooks/useFHEEncryption';
import { WorkPreference, PrimaryField } from '../types';
import toast from 'react-hot-toast';

export default function MyApplications() {
  const { address } = useAccount();
  const { readContract } = useContract();
  const { decrypt } = useFHEEncryption();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWorkPreference, setFilterWorkPreference] = useState<number | ''>('');
  const [filterPrimaryField, setFilterPrimaryField] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');

  useEffect(() => {
    if (address) {
      loadApplications();
    }
  }, [address]);

  const loadApplications = async () => {
    if (!readContract || !address) return;
    setLoading(true);
    try {
      const nextJobId = await readContract('nextJobId');
      const appsList = [];
      
      for (let i = 0; i < Number(nextJobId); i++) {
        try {
          const appResult = await readContract('applications', BigInt(i), address as `0x${string}`);
          
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
          
          if (app.applied) {
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
            
            // Fetch company information
            let companyName = 'Unknown Company';
            let companyIndustry = '';
            try {
              const companyResult = await readContract('companies', job.company as `0x${string}`);
              let companyData: any;
              if (Array.isArray(companyResult)) {
                companyData = {
                  name: companyResult[0],
                  industry: companyResult[1],
                  exists: companyResult[6],
                };
              } else {
                companyData = companyResult;
              }
              
              if (companyData && companyData.exists) {
                companyName = companyData.name || 'Unknown Company';
                companyIndustry = companyData.industry || '';
              }
            } catch {
              // Keep default values if company fetch fails
            }
            
            appsList.push({ 
              jobId: i, 
              application: app, 
              job: { ...job, companyName, companyIndustry }
            });
          }
        } catch {
        }
      }
      
      setApplications(appsList);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(({ job, application }) => {
      const matchesSearch = !searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = !filterLocation || job.location.toLowerCase().includes(filterLocation.toLowerCase());
      const matchesWorkPreference = filterWorkPreference === '' || job.workPreference === filterWorkPreference;
      const matchesPrimaryField = filterPrimaryField === '' || job.primaryField === filterPrimaryField;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'evaluated' && application.evaluated) ||
        (filterStatus === 'pending' && !application.evaluated);
      
      return matchesSearch && matchesLocation && matchesWorkPreference && matchesPrimaryField && matchesStatus;
    });
  }, [applications, searchQuery, filterLocation, filterWorkPreference, filterPrimaryField, filterStatus]);

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="my-applications">
      <div className="content-header">
        <h2>My Applications</h2>
      </div>

      <div className="search-filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by job title..."
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
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'evaluated' | 'pending')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="evaluated">Evaluated</option>
            <option value="pending">Pending</option>
          </select>
          
          {(searchQuery || filterLocation || filterWorkPreference !== '' || filterPrimaryField !== '' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterLocation('');
                setFilterWorkPreference('');
                setFilterPrimaryField('');
                setFilterStatus('all');
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      <div className="applications-list">
        {applications.length === 0 ? (
          <div className="empty-state">
            <p>No applications yet. Browse the job market to apply!</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <p>No applications match your filters.</p>
            <button onClick={() => {
              setSearchQuery('');
              setFilterLocation('');
              setFilterWorkPreference('');
              setFilterPrimaryField('');
              setFilterStatus('all');
            }}>Clear Filters</button>
          </div>
        ) : (
          filteredApplications.map(({ jobId, application, job }) => (
          <div key={jobId} className="application-card">
            <div className="application-card-content">
            <h3>{job.title}</h3>
            <p><strong>Company:</strong> {job.companyName || 'Unknown Company'}</p>
            <p><strong>Category:</strong> {job.primaryField === 0 ? 'Software' : job.primaryField === 1 ? 'Banking' : job.primaryField === 2 ? 'AI' : job.primaryField === 3 ? 'Web3' : 'Other'}</p>
            {job.companyIndustry && (
              <p><strong>Industry:</strong> {job.companyIndustry}</p>
            )}
            <p><strong>Status:</strong> {application.evaluated ? 'Evaluated' : 'Pending Evaluation'}</p>
            {application.evaluated && (
              <EligibilityDisplay 
                eligible={application.eligible} 
                decrypt={decrypt}
                companyAddress={job.company}
                readContract={readContract}
              />
            )}
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}

function EligibilityDisplay({ 
  eligible, 
  decrypt, 
  companyAddress,
  readContract 
}: { 
  eligible: any; 
  decrypt: (value: any) => Promise<any>;
  companyAddress: string;
  readContract: any;
}) {
  const [eligibility, setEligibility] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [companyEmail, setCompanyEmail] = useState<string>('');

  const handleCheck = async () => {
    setLoading(true);
    try {
      console.log('🔓 [Decryption] Decrypting eligibility status for application...');
      const result = await decrypt(eligible);
      const isEligible = result === 1 || result === true;
      console.log('✅ [Decryption] Eligibility decrypted:', isEligible);
      setEligibility(isEligible);
      
      // If eligible, fetch company email
      if (isEligible && readContract) {
        try {
          console.log('🎯 [Decryption] Application is eligible. Loading company profile...');
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
          
          if (profile && profile.exists && profile.contactEmail) {
            setCompanyEmail(profile.contactEmail);
          }
        } catch {
        }
      }
    } catch {
      toast.error('Failed to decrypt eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (eligibility !== null) {
    return (
      <div className="eligibility-result">
        {eligibility ? (
          <div>
            <p className="eligible">✅ You are eligible for this role!</p>
            {companyEmail && (
              <div className="company-contact-info" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--text-primary)' }}>
                  📧 Company Contact:
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  <strong>Email:</strong> {companyEmail}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="not-eligible">❌ You do not meet the requirements</p>
        )}
      </div>
    );
  }

  return (
    <button onClick={handleCheck} disabled={loading}>
      {loading ? 'Checking...' : 'Check Eligibility'}
    </button>
  );
}

