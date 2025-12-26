import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Registration from './components/Registration';
import Profile from './components/Profile';
import CompanyProfile from './components/CompanyProfile';
import JobManager from './components/JobManager';
import JobMarket from './components/JobMarket';
import JobApp from './components/JobApp';
import MyApplications from './components/MyApplications';
import EvaluateApplicants from './components/EvaluateApplicants';
import Companies from './components/Companies';
import CompanyJobs from './components/CompanyJobs';
import { useActiveRole } from './hooks/useActiveRole';
import { useZamaInstance, initializeFHEVM } from './hooks/useZamaInstance';
import { Role } from './types';
import './styles/app.css';

function App() {
  const { isConnected } = useAccount();
  const { activeMode: userRole, loading: roleLoading, hasIndividual, hasCompany } = useActiveRole();
  const { isInitializing: fheInitializing } = useZamaInstance();
  const [currentView, setCurrentView] = useState<string>('');

  useEffect(() => {
    initializeFHEVM().catch((err) => {
      console.error('❌ FHEVM Zama initialization failed:', err);
    });
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setCurrentView('');
      return;
    }
    
    if (!roleLoading) {
      if (!hasIndividual && !hasCompany) {
        setCurrentView('register');
      } else if (currentView === '' || currentView === 'register') {
        if (userRole === Role.Individual) {
          setCurrentView('job-market');
        } else if (userRole === Role.Company) {
          setCurrentView('job-manager');
        } else {
          setCurrentView('register');
        }
      }
    }
  }, [isConnected, roleLoading, hasIndividual, hasCompany, userRole, currentView]);


  const handleViewChange = useCallback((view: string) => {
    if (!isConnected) {
      setCurrentView('');
    } else {
      setCurrentView(view);
    }
  }, [isConnected]);

  return (
    <div className="app">
      <Header />
      
      <div className="app-layout">
        <Sidebar
          currentView={currentView}
        setCurrentView={handleViewChange}
        isConnected={isConnected}
          hasRegistered={hasIndividual || hasCompany}
          key={`sidebar-${userRole}`}
      />
      
        <main className={`main-content ${!isConnected || !(hasIndividual || hasCompany) ? 'centered' : ''}`}>
        {fheInitializing && (
          <div className="loading">Initializing FHE encryption...</div>
        )}
        {!fheInitializing && !isConnected ? (
          <div className="connect-wallet">
            <div className="welcome-hero">
              <h1>🔐 FHE Junction</h1>
              <p className="tagline-large">Confidential Job Matching with Fully Homomorphic Encryption</p>
              <p className="description">
                Connect your wallet to get started. Your data stays private while companies evaluate your eligibility.
              </p>
              <div className="features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <div>
                    <h3>Private Profiles</h3>
                    <p>Your salary, experience, and education remain encrypted</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <div>
                    <h3>Smart Matching</h3>
                    <p>Companies evaluate eligibility without seeing your data</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📧</span>
                  <div>
                    <h3>Contact Revealed</h3>
                    <p>Your contact info is only shared with eligible matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !fheInitializing ? (
          <>
            {roleLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {(currentView === 'register' || currentView === 'register-individual' || currentView === 'register-company') && (
                  <Registration 
                    targetRole={currentView === 'register-individual' ? Role.Individual : currentView === 'register-company' ? Role.Company : undefined}
                    setCurrentView={handleViewChange}
                  />
                )}
                {currentView === 'profile' && hasIndividual && <Profile />}
                {currentView === 'company-profile' && hasCompany && <CompanyProfile />}
                {currentView === 'job-manager' && hasCompany && <JobManager />}
                {currentView === 'job-market' && hasIndividual && (
                  <JobMarket setCurrentView={handleViewChange} />
                )}
                {currentView === 'companies' && hasIndividual && (
                  <Companies setCurrentView={handleViewChange} />
                )}
                {currentView.startsWith('company-jobs-') && hasIndividual && (
                  <CompanyJobs 
                    companyAddress={currentView.replace('company-jobs-', '')} 
                    setCurrentView={handleViewChange} 
                  />
                )}
                {currentView.startsWith('apply-') && hasIndividual && (
                  <JobApp jobId={parseInt(currentView.split('-')[1])} setCurrentView={handleViewChange} />
                )}
                {currentView === 'my-applications' && hasIndividual && <MyApplications />}
                {currentView === 'evaluate' && hasCompany && <EvaluateApplicants />}
                
                {((currentView === 'job-manager' || currentView === 'evaluate' || currentView === 'company-profile') && !hasCompany) && (
                  <div className="empty-state">
                    <h2>Company Profile Required</h2>
                    <p>Please register your company first to access this feature.</p>
                    <button onClick={() => handleViewChange('register-company')}>Register Company</button>
                  </div>
                )}
                
                {((currentView === 'job-market' || currentView === 'companies' || currentView === 'my-applications' || currentView === 'profile') && !hasIndividual) && (
                  <div className="empty-state">
                    <h2>Individual Profile Required</h2>
                    <p>Please register as an individual first to access this feature.</p>
                    <button onClick={() => handleViewChange('register-individual')}>Register Individual</button>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </main>
      </div>
    </div>
  );
}

export default App;
