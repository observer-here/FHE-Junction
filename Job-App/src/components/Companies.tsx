import { useState, useEffect, useMemo } from 'react';
import { useContract } from '../hooks/useContract';
import { CONTRACT_ADDRESS } from '../config/contract';
import { decodeEventLog } from 'viem';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';

interface CompaniesProps {
  setCurrentView: (view: string) => void;
}

export default function Companies({ setCurrentView }: CompaniesProps) {
  const { readContract, publicClient } = useContract();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    loadCompanies();
  }, [readContract, publicClient]);

  const loadCompanies = async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'CompanyRegistered',
          inputs: [
            { type: 'address', indexed: true, name: 'company' },
            { type: 'string', indexed: false, name: 'name' },
          ],
        } as any,
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const companiesMap = new Map<string, any>();

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: FHE_JUNCTION_ABI,
            data: log.data,
            topics: log.topics,
          });
          const companyAddr = (decoded.args as any).company;
          const companyName = (decoded.args as any).name;
          
          if (companyAddr && !companiesMap.has(companyAddr.toLowerCase())) {
            companiesMap.set(companyAddr.toLowerCase(), {
              address: companyAddr,
              name: companyName,
            });
          }
        } catch {
        }
      }

      const companiesList = [];
      const jobCounts = new Map<string, number>();
      
      // First, count ALL jobs per company (not just active ones)
      if (readContract) {
        try {
          const nextJobId = await readContract('nextJobId');
          
          for (let i = 0; i < Number(nextJobId); i++) {
            try {
              const jobResult = await readContract('jobs', BigInt(i));
              let job: any;
              if (Array.isArray(jobResult)) {
                job = {
                  company: jobResult[0],
                  exists: jobResult[11],
                };
              } else {
                job = jobResult;
              }
              
              if (job.exists) {
                const companyAddr = job.company.toLowerCase();
                jobCounts.set(companyAddr, (jobCounts.get(companyAddr) || 0) + 1);
              }
            } catch {
              // Skip invalid jobs
            }
          }
        } catch {
        }
      }
      
      for (const [address] of companiesMap) {
        try {
          if (readContract) {
            const profileResult = await readContract('companies', address as `0x${string}`);
            
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
              const jobCount = jobCounts.get(address.toLowerCase()) || 0;
              companiesList.push({
                address: address,
                ...profile,
                jobCount,
              });
            }
          }
        } catch {
        }
      }

      setCompanies(companiesList);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !searchQuery || company.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = !filterIndustry || (company.industry && company.industry.toLowerCase().includes(filterIndustry.toLowerCase()));
      const matchesLocation = !filterLocation || (company.location && company.location.toLowerCase().includes(filterLocation.toLowerCase()));
      
      return matchesSearch && matchesIndustry && matchesLocation;
    });
  }, [companies, searchQuery, filterIndustry, filterLocation]);

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div className="companies">
      <div className="content-header">
        <h2>Companies</h2>
        <button onClick={loadCompanies} disabled={loading} className="refresh-btn">
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="search-filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search companies by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters-row">
          <input
            type="text"
            placeholder="Filter by industry..."
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="filter-input"
          />
          
          <input
            type="text"
            placeholder="Filter by location..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="filter-input"
          />
          
          {(searchQuery || filterIndustry || filterLocation) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterIndustry('');
                setFilterLocation('');
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            No companies registered yet
          </p>
          <p>Companies will appear here once they register on the platform.</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            No companies match your filters
          </p>
          <button onClick={() => {
            setSearchQuery('');
            setFilterIndustry('');
            setFilterLocation('');
          }}>Clear Filters</button>
        </div>
      ) : (
        <div className="companies-list">
          {filteredCompanies.map((company) => (
            <div key={company.address} className="company-card">
              <div className="company-card-content">
                <h3>{company.name}</h3>
                
                <div className="company-card-meta">
                  <div className="company-card-meta-item">
                    <span className="company-card-meta-label">🏭 Industry</span>
                    <span className="company-card-meta-value">{company.industry || 'N/A'}</span>
                  </div>
                  
                  {company.location && (
                    <div className="company-card-meta-item">
                      <span className="company-card-meta-label">📍 Location</span>
                      <span className="company-card-meta-value">{company.location}</span>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="company-card-meta-item">
                      <span className="company-card-meta-label">🌐 Website</span>
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="company-card-meta-value"
                        style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  
                  {company.contactEmail && (
                    <div className="company-card-meta-item">
                      <span className="company-card-meta-label">📧 Contact</span>
                      <span className="company-card-meta-value">{company.contactEmail}</span>
                    </div>
                  )}
                  
                  {company.jobCount > 0 && (
                    <div className="company-card-meta-item">
                      <span className="company-card-meta-label">📋 Open Positions</span>
                      <span className="company-card-meta-value" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                        {company.jobCount} {company.jobCount === 1 ? 'Job' : 'Jobs'}
                      </span>
                    </div>
                  )}
                  
                  <div className="company-card-meta-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="company-card-meta-label">🔗 Address</span>
                    <span className="company-card-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {company.address}
                    </span>
                  </div>
                </div>
              </div>
              
              {company.jobCount >= 1 && (
                <button
                  onClick={() => setCurrentView(`company-jobs-${company.address}`)}
                  className="explore-jobs-btn"
                >
                  Explore Jobs
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

