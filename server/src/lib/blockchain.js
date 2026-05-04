import { ethers } from 'ethers';

// Connect to local Hardhat node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545/');

// Using Hardhat account #0 for testing
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(privateKey, provider);

// Hardhat deployed address
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const abi = [
  "function createComplaint(string memory _hashId, string memory _ipfsHash) external",
  "function updateStatus(string memory _hashId, uint8 _status) external",
  "function escalateComplaint(string memory _hashId) external",
  "function getComplaint(string memory _hashId) external view returns (string memory, uint8, uint256, bool)",
  "event ComplaintCreated(string indexed hashId, string ipfsHash, uint256 timestamp)",
  "event StatusUpdated(string indexed hashId, uint8 oldStatus, uint8 newStatus, uint256 timestamp)",
  "event Escalated(string indexed hashId, uint256 timestamp)"
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

export const createBlockchainComplaint = async (hashId, ipfsHash) => {
  try {
    const tx = await contract.createComplaint(hashId, ipfsHash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain error:", error);
    return null;
  }
};

export const updateBlockchainStatus = async (hashId, statusEnumIndex) => {
  try {
    const tx = await contract.updateStatus(hashId, statusEnumIndex);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain error:", error);
    return null;
  }
};

export const escalateBlockchainComplaint = async (hashId) => {
  try {
    const tx = await contract.escalateComplaint(hashId);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain error:", error);
    return null;
  }
};
