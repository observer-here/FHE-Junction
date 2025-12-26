import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useActiveRole } from '../hooks/useActiveRole';
import { useFHEEncryption } from '../hooks/useFHEEncryption';
import { Role, EducationLevel, Sex } from '../types';
import { encodeEmailToNumber } from '../utils/emailUtils';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';
import { decodeErrorResult } from 'viem';
import toast from 'react-hot-toast';

interface RegistrationProps {
  targetRole?: Role;
  setCurrentView?: (view: string) => void;
}

export default function Registration({ targetRole, setCurrentView }: RegistrationProps) {
  const { contract } = useContract();
  const { hasIndividual, hasCompany } = useActiveRole();
  const { createEncryptedInput, isReady } = useFHEEncryption();
  const [isIndividual, setIsIndividual] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState<EducationLevel>(EducationLevel.Bachelor);
  const [sex, setSex] = useState<Sex>(Sex.Male);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [companyContactEmail, setCompanyContactEmail] = useState('');
  const [location, setLocation] = useState('');

  const handleRegisterIndividual = async () => {
    if (!contract || !isReady) return;
    
    if (!expectedSalary || !experience) {
      toast.error('Please enter your expected salary and years of experience');
      return;
    }
    if (!contactEmail.trim()) {
      toast.error('Please enter your contact email');
      return;
    }
    if (!contactPhone.trim()) {
      toast.error('Please enter your contact phone number');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      const phoneDigits = contactPhone.replace(/\D/g, '');
      if (!phoneDigits || phoneDigits.length < 7) {
        toast.error('Please enter a valid phone number with at least 7 digits');
        setLoading(false);
        return;
      }
      const last10Digits = phoneDigits.slice(-10);
      const phoneNumber = parseInt(last10Digits, 10);
      if (isNaN(phoneNumber) || phoneNumber <= 0 || phoneNumber > 4294967295) {
        toast.error('Invalid phone number');
        setLoading(false);
        return;
      }
      
      const salaryNum = parseInt(expectedSalary);
      const expNum = parseInt(experience);
      
      if (isNaN(salaryNum) || isNaN(expNum)) {
        toast.error('Invalid salary or experience');
        setLoading(false);
        return;
      }
      
      const emailNumber = encodeEmailToNumber(contactEmail);
      
      console.log('🔐 [Profile Creation] Encrypting profile data:');
      console.log('  📝 Expected Salary:', salaryNum, '(euint32)');
      console.log('  📝 Experience:', expNum, 'years (euint32)');
      console.log('  📝 Education:', education, '(euint32)');
      console.log('  📝 Sex:', sex, '(euint32)');
      console.log('  📝 Contact Email:', contactEmail, '->', emailNumber.toString(), '(euint256)');
      console.log('  📝 Contact Phone:', phoneNumber, '(euint32)');
      
      const encrypted = await createEncryptedInput(
        [salaryNum, expNum, education, sex],
        emailNumber,
        [phoneNumber]
      );

      console.log('✅ [Profile Creation] Encryption successful. Encrypted handles:', encrypted.handles);
      console.log('🔄 [Profile Creation] Submitting registration transaction...');

      const registerTx = await contract.registerIndividual(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.handles[4],
        encrypted.handles[5],
        encrypted.inputProof
      );
      
      await registerTx.wait();
      console.log('✅ [Profile Creation] Registration transaction confirmed on blockchain');
      console.log('🎉 [Profile Creation] Profile created successfully with encrypted data');
      toast.success('Registered and profile created successfully!');
      // Reset form
      setExpectedSalary('');
      setExperience('');
      setContactEmail('');
      setContactPhone('');
      // Trigger profile refresh
      window.dispatchEvent(new Event('roleSwitched'));
      // Navigate to job market after successful registration
      if (setCurrentView) {
        setTimeout(() => setCurrentView('job-market'), 100);
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
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
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCompany = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.registerCompany(companyName, industry, website, companyContactEmail, location);
      await tx.wait();
      toast.success('Company registered successfully!');
      // Reset form
      setCompanyName('');
        setIndustry('');
        setWebsite('');
        setCompanyContactEmail('');
        setLocation('');
      // Trigger profile refresh
      window.dispatchEvent(new Event('roleSwitched'));
      // Navigate to job manager after successful registration
      if (setCurrentView) {
        setTimeout(() => setCurrentView('job-manager'), 100);
      }
    } catch (error: any) {
      toast.error(error?.reason || error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetRole === Role.Individual) {
      setIsIndividual(true);
    } else if (targetRole === Role.Company) {
      setIsIndividual(false);
    } else if (hasIndividual && !hasCompany) {
      setIsIndividual(false);
    } else if (!hasIndividual && hasCompany) {
      setIsIndividual(true);
    } else if (!hasIndividual && !hasCompany) {
      setIsIndividual(true);
    }
  }, [hasIndividual, hasCompany, targetRole]);

  if (!isReady && isIndividual) {
    return <div className="loading">Initializing FHE encryption...</div>;
  }

  return (
    <div className="registration">
      <div className="registration-header">
        <h2>Create Your Profile</h2>
        <p className="registration-subtitle">Join FHE Junction and start your confidential job matching journey</p>
      </div>
      
      <div className="role-selector">
        <button 
          className={isIndividual ? 'active' : ''} 
          onClick={() => setIsIndividual(true)}
          disabled={hasIndividual}
        >
          <span className="role-icon">👤</span>
          <span>Individual</span>
        </button>
        <button 
          className={!isIndividual ? 'active' : ''} 
          onClick={() => setIsIndividual(false)}
          disabled={hasCompany}
        >
          <span className="role-icon">🏢</span>
          <span>Company</span>
        </button>
      </div>

      {isIndividual ? (
        <div className="individual-registration">
          {hasIndividual ? (
            <div className="already-registered">
              <div className="success-icon">✅</div>
              <h3>Profile Already Exists</h3>
              <p>You already have an Individual profile! Switch to Company mode using the sidebar.</p>
            </div>
          ) : (
            <div className="registration-form">
              <div className="form-group">
                <label>Expected Salary (Yearly)</label>
                <input
                  type="number"
                  placeholder="e.g., 80000"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Education Level</label>
                <select value={education} onChange={(e) => setEducation(parseInt(e.target.value))}>
                  <option value={EducationLevel.Bachelor}>Bachelor</option>
                  <option value={EducationLevel.Master}>Master</option>
                  <option value={EducationLevel.PhD}>PhD</option>
                  <option value={EducationLevel.Other}>Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Sex <span className="encrypted-badge">🔒</span></label>
                <select value={sex} onChange={(e) => setSex(parseInt(e.target.value))}>
                  <option value={Sex.Male}>Male</option>
                  <option value={Sex.Female}>Female</option>
                  <option value={Sex.Other}>Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Contact Email <span className="encrypted-badge">🔒</span></label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Contact Phone <span className="encrypted-badge">🔒</span></label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              
              <button 
                onClick={handleRegisterIndividual} 
                disabled={loading || !expectedSalary || !experience || !contactEmail || !contactPhone}
                className="register-btn"
              >
                {loading ? 'Creating Profile...' : 'Create Individual Profile'}
          </button>
            </div>
          )}
        </div>
      ) : (
        <div className="company-registration">
          {hasCompany ? (
            <div className="already-registered">
              <div className="success-icon">✅</div>
              <h3>Profile Already Exists</h3>
              <p>You already have a Company profile! Switch to Individual mode using the sidebar.</p>
            </div>
          ) : (
            <div className="registration-form">
              <div className="form-group">
                <label>Company Name</label>
          <input
            type="text"
                  placeholder="Your Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
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
                  value={companyContactEmail}
                  onChange={(e) => setCompanyContactEmail(e.target.value)}
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
                onClick={handleRegisterCompany} 
                disabled={loading || !companyName || !companyContactEmail}
                className="register-btn"
              >
                {loading ? 'Registering...' : 'Register Company'}
          </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

