import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import toast from 'react-hot-toast';

export default function CompanyProfile() {
  const { address } = useAccount();
  const { contract, readContract } = useContract();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (address) {
      loadProfile();
    }
  }, [readContract, address]);

  const loadProfile = async () => {
    if (!readContract || !address) return;
    try {
      const profileResult = await readContract('companies', address as `0x${string}`);
      
      let profileData: any;
      if (Array.isArray(profileResult)) {
        profileData = {
          name: profileResult[0],
          industry: profileResult[1],
          website: profileResult[2],
          contactEmail: profileResult[3],
          location: profileResult[4],
          exists: profileResult[6],
        };
      } else {
        profileData = profileResult;
      }
      
      setProfile(profileData);
      if (profileData && profileData.exists) {
        setName(profileData.name || '');
        setIndustry(profileData.industry || '');
        setWebsite(profileData.website || '');
        setContactEmail(profileData.contactEmail || '');
        setLocation(profileData.location || '');
      }
    } catch {
      setProfile({ exists: false });
    }
  };

  const handleUpdateProfile = async () => {
    if (!contract) return;
    
    if (!name.trim() || !contactEmail.trim()) {
      toast.error('Please enter company name and contact email');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      const tx = await contract.updateCompanyProfile(name, industry, website, contactEmail, location);
      await tx.wait();
      toast.success('Company profile updated successfully!');
      setIsEditing(false);
      await loadProfile();
    } catch (error: any) {
      toast.error(error?.reason || error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="empty-state">Loading company profile...</div>;
  }

  if (!profile.exists) {
    return <div className="empty-state">Please register as a company first</div>;
  }

  return (
    <div className="company-profile">
      <div className="profile-header">
      <h2>Company Profile</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="edit-btn"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      {isEditing ? (
        <div className="profile-form">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              placeholder="Your Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Industry</label>
            <input
              type="text"
              placeholder="e.g., Technology, Finance, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              placeholder="https://yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              placeholder="contact@yourcompany.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., San Francisco, CA, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleUpdateProfile} 
            disabled={loading || !name || !contactEmail}
            className="update-btn"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      ) : (
          <div className="company-profile-view">
          <div className="company-profile-header">
            <div className="company-header-info">
              <h3 className="company-name">{profile.name}</h3>
            </div>
          </div>
          
          <div className="company-details-grid">
            {profile.industry && (
              <div className="detail-card">
                <div className="detail-icon">🏢</div>
                <div className="detail-content">
                  <span className="detail-label">Industry</span>
                  <span className="detail-value">{profile.industry}</span>
                </div>
              </div>
            )}
            
            {profile.location && (
              <div className="detail-card">
                <div className="detail-icon">📍</div>
                <div className="detail-content">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{profile.location}</span>
                </div>
              </div>
            )}
            
            {profile.website && (
              <div className="detail-card">
                <div className="detail-icon">🌐</div>
                <div className="detail-content">
                  <span className="detail-label">Website</span>
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="detail-value-link">
                    {profile.website}
                  </a>
                </div>
              </div>
            )}
            
            {profile.contactEmail && (
              <div className="detail-card">
                <div className="detail-icon">📧</div>
                <div className="detail-content">
                  <span className="detail-label">Contact Email</span>
                  <a href={`mailto:${profile.contactEmail}`} className="detail-value-link">
                    {profile.contactEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

