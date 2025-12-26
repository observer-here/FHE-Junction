import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { useFHEEncryption } from '../hooks/useFHEEncryption';
import { EducationLevel, WorkPreference, PrimaryField, Sex } from '../types';
import { FHE_JUNCTION_ABI } from '../abi/FHEJunction';
import { decodeErrorResult } from 'viem';
import toast from 'react-hot-toast';

export default function JobManager() {
  const { contract } = useContract();
  const { createEncryptedInput, isReady } = useFHEEncryption();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workPreference, setWorkPreference] = useState<WorkPreference>(WorkPreference.Remote);
  const [primaryField, setPrimaryField] = useState<PrimaryField>(PrimaryField.Software);
  const [maxSalary, setMaxSalary] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [minEducation, setMinEducation] = useState<EducationLevel>(EducationLevel.Bachelor);
  const [preferredSex, setPreferredSex] = useState<Sex>(Sex.Male);
  const [deadline, setDeadline] = useState('');
  const [vacancyCount, setVacancyCount] = useState('');

  const handleCreateJob = async () => {
    if (!contract || !isReady) return;
    
    if (!title.trim()) {
      toast.error('Please enter a job title');
      return;
    }
    if (!deadline) {
      toast.error('Please select an application deadline');
      return;
    }
    
    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    
    if (deadlineTimestamp <= now) {
      toast.error('Application deadline must be in the future');
      return;
    }
    
    if (!maxSalary || !minExperience) {
      toast.error('Please enter salary and experience requirements');
      return;
    }
    
    if (!vacancyCount || parseInt(vacancyCount) <= 0) {
      toast.error('Please enter a valid vacancy count (must be greater than 0)');
      return;
    }
    
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      console.log('🔐 [Job Creation] Encrypting job requirements:');
      console.log('  📝 Max Salary:', parseInt(maxSalary), '(euint32)');
      console.log('  📝 Min Experience:', parseInt(minExperience), 'years (euint32)');
      console.log('  📝 Min Education:', minEducation, '(euint32)');
      console.log('  📝 Preferred Sex:', preferredSex, '(euint32)');
      
      const encrypted = await createEncryptedInput(
        [parseInt(maxSalary), parseInt(minExperience), minEducation, preferredSex],
        null,
        []
      );
      
      console.log('✅ [Job Creation] Encryption successful. Encrypted handles:', encrypted.handles);

      const tx = await contract.createJob(
        title,
        location,
        workPreference,
        primaryField,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof,
        deadlineTimestamp,
        parseInt(vacancyCount)
      );

      await tx.wait();
      console.log('✅ [Job Creation] Job creation transaction confirmed on blockchain');
      console.log('🎉 [Job Creation] Job created successfully with encrypted requirements stored on-chain');
      toast.success('Job created successfully!');
      
      setTitle('');
      setLocation('');
      setWorkPreference(WorkPreference.Remote);
      setPrimaryField(PrimaryField.Software);
      setMaxSalary('');
      setMinExperience('');
      setMinEducation(EducationLevel.Bachelor);
      setPreferredSex(Sex.Male);
      setDeadline('');
      setVacancyCount('');
    } catch (error: any) {
      let errorMessage = 'Failed to create job. Please try again.';
      
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

  if (!isReady) {
    return <div className="loading">Initializing FHE encryption...</div>;
  }

  return (
    <div className="job-manager">
      <h2>Create Job Posting</h2>
      
      <div className="job-form">
        <div className="form-group">
          <label>Job Title</label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="e.g., San Francisco, CA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Work Preference</label>
          <select value={workPreference} onChange={(e) => setWorkPreference(parseInt(e.target.value))}>
            <option value={WorkPreference.Remote}>Remote</option>
            <option value={WorkPreference.Hybrid}>Hybrid</option>
            <option value={WorkPreference.OnSite}>On-Site</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Primary Field</label>
          <select value={primaryField} onChange={(e) => setPrimaryField(parseInt(e.target.value))}>
            <option value={PrimaryField.Software}>Software</option>
            <option value={PrimaryField.Banking}>Banking</option>
            <option value={PrimaryField.AI}>AI</option>
            <option value={PrimaryField.Web3}>Web3</option>
            <option value={PrimaryField.Other}>Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Max Salary <span className="encrypted-badge">🔒</span></label>
          <input
            type="number"
            placeholder="e.g., 120000"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Min Experience (Years)</label>
          <input
            type="number"
            placeholder="e.g., 3"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Min Education Level</label>
          <select value={minEducation} onChange={(e) => setMinEducation(parseInt(e.target.value))}>
            <option value={EducationLevel.Bachelor}>Bachelor</option>
            <option value={EducationLevel.Master}>Master</option>
            <option value={EducationLevel.PhD}>PhD</option>
            <option value={EducationLevel.Other}>Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Preferred Sex <span className="encrypted-badge">🔒</span></label>
          <select value={preferredSex} onChange={(e) => setPreferredSex(parseInt(e.target.value))}>
            <option value={Sex.Male}>Male</option>
            <option value={Sex.Female}>Female</option>
            <option value={Sex.Other}>Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Vacancy Count</label>
          <input
            type="number"
            placeholder="e.g., 10"
            min="1"
            value={vacancyCount}
            onChange={(e) => setVacancyCount(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Application Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        
        <button onClick={handleCreateJob} disabled={loading || !title || !deadline || !vacancyCount} className="create-job-btn">
          {loading ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </div>
  );
}

