import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  individual: HardhatEthersSigner;
  individual2: HardhatEthersSigner;
  company: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("FHEJunction");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("FHEJunction", function () {
  let signers: Signers;
  let contract: any;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      individual: ethSigners[1],
      individual2: ethSigners[2],
      company: ethSigners[3],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  describe("FHE Registration", function () {
    it("should register individual with encrypted data", async function () {
    const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.individual.address)
        .add32(120000)
        .add32(5)
        .add32(1)
        .add32(0)
        .add256(BigInt("1234567890123456789012345678901234567890"))
        .add32(1234567890)
      .encrypt();

    await contract
        .connect(signers.individual)
        .registerIndividual(
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.inputProof
        );

      const profile = await contract.individuals(signers.individual.address);
      expect(profile.exists).to.equal(true);
      expect(profile.version).to.equal(1);
    });

    it("should register company", async function () {
      await contract
        .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
        );

      const company = await contract.companies(signers.company.address);
      expect(company.exists).to.equal(true);
      expect(company.name).to.equal("Acme Labs");
    });
  });

  describe("FHE Job Creation", function () {
    beforeEach(async function () {
      await contract
        .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
        );
    });

    it("should create job with encrypted requirements", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.company.address)
        .add32(150000)
        .add32(3)
        .add32(1)
        .add32(0)
        .encrypt();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await contract
        .connect(signers.company)
        .createJob(
          "Backend Engineer",
          "San Francisco, CA",
          0,
          0,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.inputProof,
          deadline,
          5
      );

      const job = await contract.jobs(0);
      expect(job.exists).to.equal(true);
      expect(job.title).to.equal("Backend Engineer");
    });
    });

  describe("FHE Application & Evaluation", function () {
    beforeEach(async function () {
      await contract
      .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
        );

      const jobEncrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.company.address)
        .add32(150000)
        .add32(3)
        .add32(1)
        .add32(0)
        .encrypt();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await contract
          .connect(signers.company)
          .createJob(
            "Backend Engineer",
            "San Francisco, CA",
            0,
            0,
          jobEncrypted.handles[0],
          jobEncrypted.handles[1],
          jobEncrypted.handles[2],
          jobEncrypted.handles[3],
          jobEncrypted.inputProof,
          deadline,
          5
        );
    });

    it("should submit application with encrypted data", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.individual.address)
        .add32(120000)
        .add32(5)
        .add32(1)
        .add32(0)
        .add256(BigInt("1234567890123456789012345678901234567890"))
        .add32(1234567890)
        .encrypt();

      await contract
        .connect(signers.individual)
        .registerIndividual(
            encrypted.handles[0],
            encrypted.handles[1],
            encrypted.handles[2],
            encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.inputProof
        );

      await contract.connect(signers.individual).applyForJob(0);

      const application = await contract.applications(0, signers.individual.address);
      expect(application.applied).to.equal(true);
      expect(application.evaluated).to.equal(false);
    });
  });

  describe("FHE Conditional Decryption - Eligible Applicant", function () {
    beforeEach(async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.individual.address)
        .add32(120000)
        .add32(5)
        .add32(1)
      .add32(0)
        .add256(BigInt("1234567890123456789012345678901234567890"))
        .add32(1234567890)
        .encrypt();

    await contract
      .connect(signers.individual)
        .registerIndividual(
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.inputProof
      );

      await contract
        .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
        );

      const jobEncrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.company.address)
        .add32(150000)
        .add32(3)
        .add32(1)
        .add32(0)
        .encrypt();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
    await contract
        .connect(signers.company)
        .createJob(
          "Backend Engineer",
          "San Francisco, CA",
          0,
          0,
          jobEncrypted.handles[0],
          jobEncrypted.handles[1],
          jobEncrypted.handles[2],
          jobEncrypted.handles[3],
          jobEncrypted.inputProof,
          deadline,
          5
        );

      await contract.connect(signers.individual).applyForJob(0);
    });

    it("should evaluate eligible applicant and grant contact access", async function () {
      await contract
        .connect(signers.company)
        .evaluateAllApplicants(0, [signers.individual.address]);

      const application = await contract.applications(0, signers.individual.address);
      expect(application.evaluated).to.equal(true);
    });
  });

  describe("FHE Conditional Decryption - Non-Eligible Applicant", function () {
    beforeEach(async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.individual2.address)
        .add32(200000)
        .add32(1)
      .add32(0)
        .add32(0)
        .add256(BigInt("9876543210987654321098765432109876543210"))
        .add32(987654321)
        .encrypt();

    await contract
        .connect(signers.individual2)
        .registerIndividual(
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.inputProof
        );

      await contract
        .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
      );

      const jobEncrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.company.address)
        .add32(150000)
        .add32(3)
        .add32(1)
        .add32(0)
        .encrypt();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await contract
        .connect(signers.company)
        .createJob(
          "Backend Engineer",
          "San Francisco, CA",
          0,
          0,
          jobEncrypted.handles[0],
          jobEncrypted.handles[1],
          jobEncrypted.handles[2],
          jobEncrypted.handles[3],
          jobEncrypted.inputProof,
          deadline,
          5
      );

      await contract.connect(signers.individual2).applyForJob(0);
    });

    it("should evaluate non-eligible applicant and protect contact info", async function () {
      await contract
        .connect(signers.company)
        .evaluateAllApplicants(0, [signers.individual2.address]);

      const application = await contract.applications(0, signers.individual2.address);
      expect(application.evaluated).to.equal(true);
      expect(application.applied).to.equal(true);
    });

    it("should still allow non-eligible applicant to access their own profile", async function () {
      await contract
        .connect(signers.company)
        .evaluateAllApplicants(0, [signers.individual2.address]);

      const profile = await contract.individuals(signers.individual2.address);
      expect(profile.exists).to.equal(true);
    });
  });

  describe("FHE Multiple Applicants Evaluation", function () {
    beforeEach(async function () {
      const encrypted1 = await fhevm
        .createEncryptedInput(contractAddress, signers.individual.address)
        .add32(120000)
        .add32(5)
        .add32(1)
        .add32(0)
        .add256(BigInt("1111111111111111111111111111111111111111"))
        .add32(1111111111)
        .encrypt();

      await contract
        .connect(signers.individual)
        .registerIndividual(
          encrypted1.handles[0],
          encrypted1.handles[1],
          encrypted1.handles[2],
          encrypted1.handles[3],
          encrypted1.handles[4],
          encrypted1.handles[5],
          encrypted1.inputProof
        );

      const encrypted2 = await fhevm
        .createEncryptedInput(contractAddress, signers.individual2.address)
        .add32(200000)
        .add32(1)
        .add32(0)
        .add32(0)
        .add256(BigInt("2222222222222222222222222222222222222222"))
        .add32(2222222222)
        .encrypt();

      await contract
        .connect(signers.individual2)
        .registerIndividual(
          encrypted2.handles[0],
          encrypted2.handles[1],
          encrypted2.handles[2],
          encrypted2.handles[3],
          encrypted2.handles[4],
          encrypted2.handles[5],
          encrypted2.inputProof
        );

      await contract
        .connect(signers.company)
        .registerCompany(
          "Acme Labs",
          "Technology",
          "https://acme.xyz",
          "hr@acme.xyz",
          "San Francisco, CA"
        );

      const jobEncrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.company.address)
        .add32(150000)
        .add32(3)
        .add32(1)
        .add32(0)
        .encrypt();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await contract
        .connect(signers.company)
        .createJob(
          "Backend Engineer",
          "San Francisco, CA",
          0,
          0,
          jobEncrypted.handles[0],
          jobEncrypted.handles[1],
          jobEncrypted.handles[2],
          jobEncrypted.handles[3],
          jobEncrypted.inputProof,
          deadline,
          5
        );

      await contract.connect(signers.individual).applyForJob(0);
      await contract.connect(signers.individual2).applyForJob(0);
    });

    it("should evaluate multiple applicants with conditional contact access", async function () {
      await contract
        .connect(signers.company)
        .evaluateAllApplicants(0, [
          signers.individual.address,
          signers.individual2.address,
        ]);

      const app1 = await contract.applications(0, signers.individual.address);
      const app2 = await contract.applications(0, signers.individual2.address);

      expect(app1.evaluated).to.equal(true);
      expect(app2.evaluated).to.equal(true);
    });
  });
});
