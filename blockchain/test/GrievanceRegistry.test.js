import { expect } from "chai";
import hre from "hardhat";

describe("GrievanceRegistry", function () {
  let registry;
  let owner;
  let other;

  beforeEach(async function () {
    [owner, other] = await hre.ethers.getSigners();
    const GrievanceRegistry = await hre.ethers.getContractFactory("GrievanceRegistry");
    registry = await GrievanceRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("createComplaint", function () {
    it("should create a complaint successfully", async function () {
      const hashId = "complaint-001";
      const ipfsHash = "QmTestHash123456789012345678901234567890";

      await expect(registry.createComplaint(hashId, ipfsHash))
        .to.emit(registry, "ComplaintCreated");

      const result = await registry.getComplaint(hashId);
      expect(result[0]).to.equal(ipfsHash);     // ipfsHash
      expect(result[1]).to.equal(0n);            // status = PENDING (0)
      expect(result[2]).to.be.gt(0n);            // timestamp > 0
      expect(result[3]).to.equal(false);          // isEscalated = false
    });

    it("should reject duplicate complaint IDs", async function () {
      const hashId = "complaint-dup";
      const ipfsHash = "QmDuplicate";

      await registry.createComplaint(hashId, ipfsHash);
      await expect(registry.createComplaint(hashId, ipfsHash))
        .to.be.revertedWith("Complaint already exists");
    });

    it("should reject non-owner calls", async function () {
      await expect(
        registry.connect(other).createComplaint("test", "QmTest")
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("updateStatus", function () {
    const hashId = "complaint-status";
    const ipfsHash = "QmStatusTest";

    beforeEach(async function () {
      await registry.createComplaint(hashId, ipfsHash);
    });

    it("should update status from PENDING to IN_PROGRESS", async function () {
      await expect(registry.updateStatus(hashId, 1)) // 1 = IN_PROGRESS
        .to.emit(registry, "StatusUpdated");

      const result = await registry.getComplaint(hashId);
      expect(result[1]).to.equal(1n); // IN_PROGRESS
    });

    it("should update status from PENDING to RESOLVED", async function () {
      await registry.updateStatus(hashId, 2); // 2 = RESOLVED
      const result = await registry.getComplaint(hashId);
      expect(result[1]).to.equal(2n);
    });

    it("should reject update for non-existent complaint", async function () {
      await expect(registry.updateStatus("does-not-exist", 1))
        .to.be.revertedWith("Complaint does not exist");
    });

    it("should reject non-owner calls", async function () {
      await expect(
        registry.connect(other).updateStatus(hashId, 1)
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("escalateComplaint", function () {
    const hashId = "complaint-escalate";
    const ipfsHash = "QmEscalateTest";

    beforeEach(async function () {
      await registry.createComplaint(hashId, ipfsHash);
    });

    it("should escalate a complaint", async function () {
      await expect(registry.escalateComplaint(hashId))
        .to.emit(registry, "Escalated");

      const result = await registry.getComplaint(hashId);
      expect(result[1]).to.equal(3n); // ESCALATED
      expect(result[3]).to.equal(true); // isEscalated
    });

    it("should reject double escalation", async function () {
      await registry.escalateComplaint(hashId);
      await expect(registry.escalateComplaint(hashId))
        .to.be.revertedWith("Already escalated");
    });

    it("should reject escalation for non-existent complaint", async function () {
      await expect(registry.escalateComplaint("ghost"))
        .to.be.revertedWith("Complaint does not exist");
    });

    it("should reject non-owner calls", async function () {
      await expect(
        registry.connect(other).escalateComplaint(hashId)
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("getComplaint", function () {
    it("should revert for non-existent complaint", async function () {
      await expect(registry.getComplaint("nope"))
        .to.be.revertedWith("Complaint does not exist");
    });
  });

  describe("Immutability", function () {
    it("should not allow deletion — no delete function exists", async function () {
      // The contract has no delete function by design.
      // Verify the contract ABI has no such method.
      const fragment = registry.interface.getFunction("deleteComplaint");
      expect(fragment).to.be.null;
    });

    it("should preserve full history via events", async function () {
      const hashId = "history-test";
      await registry.createComplaint(hashId, "QmHistory");
      await registry.updateStatus(hashId, 1); // IN_PROGRESS
      await registry.updateStatus(hashId, 2); // RESOLVED

      // Query all StatusUpdated events for this complaint
      const filter = registry.filters.StatusUpdated(hashId);
      const events = await registry.queryFilter(filter);
      
      // We should have 2 status updates
      expect(events.length).to.equal(2);
    });
  });
});
