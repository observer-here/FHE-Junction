import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useFHEEncryption } from '../hooks/useFHEEncryption';
import { EducationLevel, Sex } from '../types';
import { encodeEmailToNumber, decodeNumberToEmail } from '../utils/emailUtils';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';
import { decodeErrorResult } from 'viem';
import toast from 'react-hot-toast';

export default function Profile() {
  const { address } = useAccount();
  const { contract, readContract } = useContract();
  const { createEncryptedInput, decrypt, isReady } = useFHEEncryption();
  
  const [loading, setLoading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileVersion, setProfileVersion] = useState<number | null>(null);
  const [encryptedProfile, setEncryptedProfile] = useState<any>(null);
  
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState<EducationLevel>(EducationLevel.Bachelor);
  const [sex, setSex] = useState<Sex>(Sex.Male);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    if (address) {
      loadProfile();
    }
  }, [address]);

  const loadProfile = async () => {
    if (!readContract || !address) return;
    try {
      const profileResult = await readContract('individuals', address as `0x${string}`);
      
      let profileData: any;
      if (Array.isArray(profileResult)) {
        profileData = {
          expectedSalary: profileResult[0],
          experience: profileResult[1],
          education: profileResult[2],
          sex: profileResult[3],
          contactEmail: profileResult[4],
          contactPhone: profileResult[5],
          version: profileResult[6],
          exists: profileResult[7],
        };
      } else {
        profileData = profileResult;
      }
      
      setProfileExists(profileData.exists);
      setProfileVersion(profileData.exists ? Number(profileData.version) : null);
      
      if (profileData.exists) {
        setEncryptedProfile({
          expectedSalary: profileData.expectedSalary,
          experience: profileData.experience,
          education: profileData.education,
          sex: profileData.sex,
          contactEmail: profileData.contactEmail,
          contactPhone: profileData.contactPhone,
        });
      } else {
        setEncryptedProfile(null);
      }
      
      setContactEmail('');
      setContactPhone('');
    } catch {
      toast.error('Failed to load profile');
    }
  };

  const handleUpdateProfile = async () => {
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
      
      console.log('🔐 [Profile Update] Encrypting updated profile data:');
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

      console.log('✅ [Profile Update] Encryption successful. Encrypted handles:', encrypted.handles);
      console.log('🔄 [Profile Update] Submitting update transaction...');

      const tx = await contract.updateIndividualProfile(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.handles[4],
        encrypted.handles[5],
        encrypted.inputProof
      );
      
      await tx.wait();
      console.log('✅ [Profile Update] Update transaction confirmed on blockchain');
      console.log('🎉 [Profile Update] Profile updated successfully with encrypted data');
      toast.success('Profile updated successfully!');
      await loadProfile();
    } catch (error: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      
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
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptProfile = async () => {
    if (!decrypt || !encryptedProfile) return;
    
    setDecrypting(true);
    try {
      console.log('🔓 [Profile Decryption] Starting to decrypt profile data (one by one)...');
      
      console.log('🔓 [1/6] Decrypting salary...');
      const salary = await decrypt(encryptedProfile.expectedSalary);
      setExpectedSalary(String(salary));
      console.log('✅ [1/6] Salary decrypted:', salary);
      
      console.log('🔓 [2/6] Decrypting experience...');
      const exp = await decrypt(encryptedProfile.experience);
      setExperience(String(exp));
      console.log('✅ [2/6] Experience decrypted:', exp);
      
      console.log('🔓 [3/6] Decrypting education...');
      const edu = await decrypt(encryptedProfile.education);
      setEducation(Number(edu) as EducationLevel);
      console.log('✅ [3/6] Education decrypted:', edu);
      
      console.log('🔓 [4/6] Decrypting sex...');
      const sexValue = await decrypt(encryptedProfile.sex);
      setSex(Number(sexValue) as Sex);
      console.log('✅ [4/6] Sex decrypted:', sexValue);
      
      console.log('🔓 [5/6] Decrypting email...');
      const emailNumber = await decrypt(encryptedProfile.contactEmail);
      try {
        const decodedEmail = decodeNumberToEmail(BigInt(emailNumber));
        setContactEmail(decodedEmail);
        console.log('✅ [5/6] Email decrypted:', decodedEmail);
      } catch (emailError) {
        console.warn('⚠️ [5/6] Could not decode email:', emailError);
        setContactEmail('');
      }
      
      console.log('🔓 [6/6] Decrypting phone...');
      const phone = await decrypt(encryptedProfile.contactPhone);
      setContactPhone(String(phone));
      console.log('✅ [6/6] Phone decrypted:', phone);
      
      console.log('🎉 [Profile Decryption] All fields decrypted successfully!');
      toast.success('Profile decrypted successfully!');
    } catch (error: any) {
      console.error('❌ [Profile Decryption] Failed to decrypt profile:', error);
      toast.error('Failed to decrypt profile. Please try again.');
    } finally {
      setDecrypting(false);
    }
  };

  if (!isReady) {
    return <div className="loading">Initializing FHE encryption...</div>;
  }

  return (
    <div className="profile">
      <h2>Individual Profile</h2>
      {profileExists && profileVersion !== null && (
        <div className="profile-version">
          <span>Profile Version: {profileVersion}</span>
          {encryptedProfile && (
            <button 
              onClick={handleDecryptProfile} 
              disabled={decrypting}
              className="decrypt-profile-btn"
            >
              {decrypting ? 'Decrypting...' : 'View Current Profile'}
            </button>
          )}
        </div>
      )}
      
      <div className="profile-form">
        <input
          type="number"
          placeholder="Expected Salary (Yearly)"
          value={expectedSalary}
          onChange={(e) => setExpectedSalary(e.target.value)}
        />
        
        <input
          type="number"
          placeholder="Years of Experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
        
        <select value={education} onChange={(e) => setEducation(parseInt(e.target.value))}>
          <option value={EducationLevel.Bachelor}>Bachelor</option>
          <option value={EducationLevel.Master}>Master</option>
          <option value={EducationLevel.PhD}>PhD</option>
          <option value={EducationLevel.Other}>Other</option>
        </select>
        
        <select value={sex} onChange={(e) => setSex(parseInt(e.target.value))}>
          <option value={Sex.Male}>Male</option>
          <option value={Sex.Female}>Female</option>
          <option value={Sex.Other}>Other</option>
        </select>
        
        <input
          type="email"
          placeholder="Contact Email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
        
        <input
          type="tel"
          placeholder="Contact Phone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
        />
        
        <button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? 'Updating...' : profileExists ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
    </div>
  );
}

