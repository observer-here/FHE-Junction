// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
import { FHE, euint32, euint256, ebool, externalEuint32, externalEuint256 } from "@fhevm/solidity/lib/FHE.sol"; 
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @notice Confidential hiring protocol using Zama FHEVM - Individuals are private, companies are public
contract FHEJunction is ZamaEthereumConfig {
    enum Role { None, Individual, Company }

    struct IndividualProfile {
        euint32 expectedSalary;
        euint32 experience;
        euint32 education;
        euint32 sex;
        euint256 contactEmail;
        euint32 contactPhone;
        uint32 version;
        bool exists;
    }

    struct CompanyProfile {
        string name;
        string industry;
        string website;
        string contactEmail;
        string location;
        address owner;
        bool exists;
    }

    struct Job {
        address company;
        string title;
        string location;
        uint32 workPreference;
        uint32 primaryField;
        euint32 maxSalary;
        euint32 minExperience;
        euint32 minEducation;
        euint32 preferredSex;
        uint256 applicationDeadline;
        uint32 vacancyCount;
        bool exists;
    }

    struct Application {
        euint32 salary;
        euint32 experience;
        euint32 education;
        euint32 sex;
        uint32 profileVersion;
        euint256 contactEmail;
        euint32 contactPhone;
        ebool eligible;
        bool evaluated;
        bool applied;
    }

    event IndividualRegistered(address indexed individual);
    event CompanyRegistered(address indexed company, string name);
    event CompanyProfileUpdated(address indexed company, string name);
    event IndividualProfileUpdated(address indexed individual, uint32 version);
    event JobCreated(uint256 indexed jobId, address indexed company, string title);
    event ApplicationSubmitted(uint256 indexed jobId, address indexed applicant);
    event ApplicantEvaluated(uint256 indexed jobId, address indexed applicant);

    uint256 public nextJobId;
    mapping(address => IndividualProfile) public individuals;
    mapping(address => CompanyProfile) public companies;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(address => Application)) public applications;

    modifier onlyIndividual() {
        require(individuals[msg.sender].exists, "Individual profile required");
        _;
    }

    modifier onlyCompany() {
        require(companies[msg.sender].exists, "Company profile required");
        _;
    }

    function registerIndividual(
        externalEuint32 extSalary,
        externalEuint32 extExperience,
        externalEuint32 extEducation,
        externalEuint32 extSex,
        externalEuint256 extContactEmail,
        externalEuint32 extContactPhone,
        bytes calldata attestation
    ) external {
        require(!individuals[msg.sender].exists, "Individual profile already exists");
        
        euint32 salary = FHE.fromExternal(extSalary, attestation);
        euint32 experience = FHE.fromExternal(extExperience, attestation);
        euint32 education = FHE.fromExternal(extEducation, attestation);
        euint32 sex = FHE.fromExternal(extSex, attestation);
        euint256 contactEmail = FHE.fromExternal(extContactEmail, attestation);
        euint32 contactPhone = FHE.fromExternal(extContactPhone, attestation);

        individuals[msg.sender] = IndividualProfile(salary, experience, education, sex, contactEmail, contactPhone, 1, true);

        FHE.allowThis(salary);
        FHE.allowThis(experience);
        FHE.allowThis(education);
        FHE.allowThis(sex);
        FHE.allowThis(contactEmail);
        FHE.allowThis(contactPhone);
        FHE.allow(salary, msg.sender);
        FHE.allow(experience, msg.sender);
        FHE.allow(education, msg.sender);
        FHE.allow(sex, msg.sender);
        FHE.allow(contactEmail, msg.sender);
        FHE.allow(contactPhone, msg.sender);

        emit IndividualRegistered(msg.sender);
        emit IndividualProfileUpdated(msg.sender, 1);
    }

    function registerCompany(string calldata name, string calldata industry, string calldata website, string calldata contactEmail, string calldata location) external {
        require(!companies[msg.sender].exists, "Company profile already exists");
        companies[msg.sender] = CompanyProfile(name, industry, website, contactEmail, location, msg.sender, true);
        emit CompanyRegistered(msg.sender, name);
    }

    function updateCompanyProfile(string calldata name, string calldata industry, string calldata website, string calldata contactEmail, string calldata location) external onlyCompany {
        require(companies[msg.sender].exists, "Company profile does not exist");
        companies[msg.sender].name = name;
        companies[msg.sender].industry = industry;
        companies[msg.sender].website = website;
        companies[msg.sender].contactEmail = contactEmail;
        companies[msg.sender].location = location;
        emit CompanyProfileUpdated(msg.sender, name);
    }

    function updateIndividualProfile(
        externalEuint32 extSalary,
        externalEuint32 extExperience,
        externalEuint32 extEducation,
        externalEuint32 extSex,
        externalEuint256 extContactEmail,
        externalEuint32 extContactPhone,
        bytes calldata attestation
    ) external onlyIndividual {
        IndividualProfile storage p = individuals[msg.sender];
        uint32 nextVersion = p.exists ? p.version + 1 : 1;
        
        euint32 salary = FHE.fromExternal(extSalary, attestation);
        euint32 experience = FHE.fromExternal(extExperience, attestation);
        euint32 education = FHE.fromExternal(extEducation, attestation);
        euint32 sex = FHE.fromExternal(extSex, attestation);
        euint256 contactEmail = FHE.fromExternal(extContactEmail, attestation);
        euint32 contactPhone = FHE.fromExternal(extContactPhone, attestation);

        individuals[msg.sender] = IndividualProfile(salary, experience, education, sex, contactEmail, contactPhone, nextVersion, true);

        FHE.allowThis(salary);
        FHE.allowThis(experience);
        FHE.allowThis(education);
        FHE.allowThis(sex);
        FHE.allowThis(contactEmail);
        FHE.allowThis(contactPhone);
        FHE.allow(salary, msg.sender);
        FHE.allow(experience, msg.sender);
        FHE.allow(education, msg.sender);
        FHE.allow(sex, msg.sender);
        FHE.allow(contactEmail, msg.sender);
        FHE.allow(contactPhone, msg.sender);

        emit IndividualProfileUpdated(msg.sender, nextVersion);
    }

    function createJob(
        string calldata title,
        string calldata location,
        uint32 workPreference,
        uint32 primaryField,
        externalEuint32 extMaxSalary,
        externalEuint32 extMinExperience,
        externalEuint32 extMinEducation,
        externalEuint32 extPreferredSex,
        bytes calldata attestation,
        uint256 applicationDeadline,
        uint32 vacancyCount
    ) external onlyCompany returns (uint256 jobId) {
        require(companies[msg.sender].exists, "Company profile required");
        require(applicationDeadline > block.timestamp, "Invalid deadline");
        require(vacancyCount > 0, "Vacancy count must be greater than 0");

        jobId = nextJobId++;
        euint32 maxSalary = FHE.fromExternal(extMaxSalary, attestation);
        euint32 minExperience = FHE.fromExternal(extMinExperience, attestation);
        euint32 minEducation = FHE.fromExternal(extMinEducation, attestation);
        euint32 preferredSex = FHE.fromExternal(extPreferredSex, attestation);

        jobs[jobId] = Job(msg.sender, title, location, workPreference, primaryField, maxSalary, minExperience, minEducation, preferredSex, applicationDeadline, vacancyCount, true);

        FHE.allowThis(maxSalary);
        FHE.allowThis(minExperience);
        FHE.allowThis(minEducation);
        FHE.allowThis(preferredSex);
        emit JobCreated(jobId, msg.sender, title);
    }

    function applyForJob(uint256 jobId) external onlyIndividual {
        Job storage job = jobs[jobId];
        require(job.exists, "Job not found");
        require(block.timestamp < job.applicationDeadline, "Applications closed");

        IndividualProfile storage p = individuals[msg.sender];
        require(p.exists, "Profile required");
        require(!applications[jobId][msg.sender].applied, "Already applied");

        applications[jobId][msg.sender] = Application(p.expectedSalary, p.experience, p.education, p.sex, p.version, p.contactEmail, p.contactPhone, FHE.asEbool(false), false, true);

        FHE.allowThis(p.expectedSalary);
        FHE.allowThis(p.experience);
        FHE.allowThis(p.education);
        FHE.allowThis(p.sex);
        FHE.allowThis(p.contactEmail);
        FHE.allowThis(p.contactPhone);
        emit ApplicationSubmitted(jobId, msg.sender);
    }

    function evaluateAllApplicants(uint256 jobId, address[] calldata applicants) external onlyCompany {
        Job storage job = jobs[jobId];
        require(job.exists, "Job not found");
        require(job.company == msg.sender, "Not job owner");

        for (uint i = 0; i < applicants.length; i++) {
            Application storage app = applications[jobId][applicants[i]];
            if (!app.applied || app.evaluated) continue;

            ebool eligible = FHE.and(FHE.and(FHE.and(FHE.le(app.salary, job.maxSalary), FHE.ge(app.experience, job.minExperience)), FHE.ge(app.education, job.minEducation)), FHE.eq(app.sex, job.preferredSex));
        app.eligible = eligible;
        app.evaluated = true;

        FHE.allowThis(eligible);
            FHE.allow(eligible, applicants[i]);
        FHE.allow(eligible, job.company);
            
            euint256 originalEmail = app.contactEmail;
            euint32 originalPhone = app.contactPhone;
            
            app.contactEmail = FHE.select(eligible, originalEmail, FHE.asEuint256(0));
            app.contactPhone = FHE.select(eligible, originalPhone, FHE.asEuint32(0));
            
            FHE.allowThis(app.contactEmail);
            FHE.allowThis(app.contactPhone);
            
            FHE.allow(originalEmail, applicants[i]);
            FHE.allow(originalPhone, applicants[i]);
            
            FHE.allow(app.contactEmail, job.company);
            FHE.allow(app.contactPhone, job.company);
            
            emit ApplicantEvaluated(jobId, applicants[i]);
        }
    }

}
