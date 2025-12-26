import { Role } from '../types';
import { useActiveRole } from '../hooks/useActiveRole';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isConnected: boolean;
  hasRegistered: boolean;
}

export default function Sidebar({ currentView, setCurrentView, isConnected, hasRegistered }: SidebarProps) {
  const { activeMode, hasIndividual, hasCompany, switchMode } = useActiveRole();

  if (!isConnected || !hasRegistered) {
    return null;
  }

  const getDisplayMode = (): Role => {
    if (currentView === 'register-company' || currentView.startsWith('register-company')) {
      return Role.Company;
    }
    if (currentView === 'register-individual' || currentView.startsWith('register-individual')) {
      return Role.Individual;
    }
    if (currentView === 'job-manager' || currentView === 'evaluate' || currentView === 'company-profile') {
      return Role.Company;
    }
    if (currentView === 'job-market' || currentView === 'companies' || currentView === 'my-applications' || currentView === 'profile' || currentView.startsWith('apply-') || currentView.startsWith('company-jobs-')) {
      return Role.Individual;
    }
    return activeMode;
  };

  const displayMode = getDisplayMode();

  const handleSwitchClick = (targetRole: Role) => {
    if (targetRole === Role.Individual) {
      if (hasIndividual) {
        switchMode(Role.Individual);
        setCurrentView('job-market');
      } else {
        setCurrentView('register-individual');
      }
    } else if (targetRole === Role.Company) {
      if (hasCompany) {
        switchMode(Role.Company);
        setCurrentView('job-manager');
      } else {
        setCurrentView('register-company');
      }
    }
  };

  const individualMenuItems = [
    { id: 'job-market', label: 'Job Market', icon: '💼' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'my-applications', label: 'My Applications', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const companyMenuItems = [
    { id: 'job-manager', label: 'Create Job', icon: '➕' },
    { id: 'evaluate', label: 'Evaluate Applicants', icon: '✅' },
    { id: 'company-profile', label: 'Company Profile', icon: '🏢' },
  ];

  const menuItems = displayMode === Role.Individual ? individualMenuItems : companyMenuItems;

  return (
    <aside className="sidebar" key={`sidebar-${displayMode}`}>
      <div className="sidebar-content">
        <div className="sidebar-mode-switcher">
          <div className="mode-indicator">
            <span className="mode-icon">{displayMode === Role.Individual ? '👤' : '🏢'}</span>
            <span className="mode-text">{displayMode === Role.Individual ? 'Individual' : 'Company'} Mode</span>
          </div>
          {displayMode === Role.Individual ? (
            <button 
              className="mode-switch-btn"
              onClick={() => handleSwitchClick(Role.Company)}
              title="Switch to Company Mode"
            >
              Switch to Company
            </button>
          ) : (
            <button 
              className="mode-switch-btn"
              onClick={() => handleSwitchClick(Role.Individual)}
              title="Switch to Individual Mode"
            >
              Switch to Individual
            </button>
          )}
        </div>
        <nav className="sidebar-nav" key={`nav-${displayMode}`}>
          {menuItems.map((item) => {
            const isDisabled = (displayMode === Role.Company && !hasCompany) || (displayMode === Role.Individual && !hasIndividual);
            const isCompanyItem = companyMenuItems.some(ci => ci.id === item.id);
            const shouldRedirect = isCompanyItem && !hasCompany;
            
            return (
              <button
                key={`${displayMode}-${item.id}`}
                className={`sidebar-item ${currentView === item.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (shouldRedirect) {
                    setCurrentView('register-company');
                  } else if (displayMode === Role.Individual && !hasIndividual && individualMenuItems.some(ii => ii.id === item.id)) {
                    setCurrentView('register-individual');
                  } else if (displayMode === Role.Company && !hasCompany && companyMenuItems.some(ci => ci.id === item.id)) {
                    setCurrentView('register-company');
                  } else if (!isDisabled) {
                    setCurrentView(item.id);
                  }
                }}
                disabled={isDisabled && !shouldRedirect}
                title={isDisabled && !shouldRedirect ? 'Please register first' : ''}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

