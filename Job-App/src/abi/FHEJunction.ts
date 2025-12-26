export const FHE_JUNCTION_ABI = [
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "applicant",
        "type": "address"
      }
    ],
    "name": "ApplicantEvaluated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "applicant",
        "type": "address"
      }
    ],
    "name": "ApplicationSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "company",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "CompanyProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "company",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "CompanyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "individual",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "version",
        "type": "uint32"
      }
    ],
    "name": "IndividualProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "individual",
        "type": "address"
      }
    ],
    "name": "IndividualRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "company",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "JobCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "applications",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "salary",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "experience",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "education",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "sex",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "profileVersion",
        "type": "uint32"
      },
      {
        "internalType": "euint256",
        "name": "contactEmail",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "contactPhone",
        "type": "bytes32"
      },
      {
        "internalType": "ebool",
        "name": "eligible",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "evaluated",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "applied",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "applyForJob",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "companies",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "industry",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "website",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contactEmail",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confidentialProtocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint32",
        "name": "workPreference",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "primaryField",
        "type": "uint32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extMaxSalary",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extMinExperience",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extMinEducation",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extPreferredSex",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "attestation",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "applicationDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "vacancyCount",
        "type": "uint32"
      }
    ],
    "name": "createJob",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "applicants",
        "type": "address[]"
      }
    ],
    "name": "evaluateAllApplicants",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "individuals",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "expectedSalary",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "experience",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "education",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "sex",
        "type": "bytes32"
      },
      {
        "internalType": "euint256",
        "name": "contactEmail",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "contactPhone",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "version",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "jobs",
    "outputs": [
      {
        "internalType": "address",
        "name": "company",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint32",
        "name": "workPreference",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "primaryField",
        "type": "uint32"
      },
      {
        "internalType": "euint32",
        "name": "maxSalary",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "minExperience",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "minEducation",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "preferredSex",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "applicationDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "vacancyCount",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextJobId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "industry",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "website",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contactEmail",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "registerCompany",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "extSalary",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extExperience",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extEducation",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extSex",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint256",
        "name": "extContactEmail",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extContactPhone",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "attestation",
        "type": "bytes"
      }
    ],
    "name": "registerIndividual",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "industry",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "website",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contactEmail",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "updateCompanyProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "extSalary",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extExperience",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extEducation",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extSex",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint256",
        "name": "extContactEmail",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "extContactPhone",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "attestation",
        "type": "bytes"
      }
    ],
    "name": "updateIndividualProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
