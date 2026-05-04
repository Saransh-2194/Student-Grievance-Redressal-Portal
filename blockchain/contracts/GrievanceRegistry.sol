// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GrievanceRegistry {
    enum Status { CREATED, ASSIGNED, IN_PROGRESS, UNDER_REVIEW, RESOLVED, CLOSED, ESCALATED }

    struct Complaint {
        string ipfsHash; 
        Status status;
        uint256 timestamp;
        bool isEscalated;
        bool exists;
    }

    mapping(string => Complaint) public complaints;

    event ComplaintCreated(string indexed hashId, string ipfsHash, uint256 timestamp);
    event StatusUpdated(string indexed hashId, Status oldStatus, Status newStatus, uint256 timestamp);
    event Escalated(string indexed hashId, uint256 timestamp);

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createComplaint(string memory _hashId, string memory _ipfsHash) external onlyOwner {
        require(!complaints[_hashId].exists, "Complaint already exists");

        complaints[_hashId] = Complaint({
            ipfsHash: _ipfsHash,
            status: Status.CREATED,
            timestamp: block.timestamp,
            isEscalated: false,
            exists: true
        });

        emit ComplaintCreated(_hashId, _ipfsHash, block.timestamp);
    }

    function updateStatus(string memory _hashId, Status _status) external onlyOwner {
        require(complaints[_hashId].exists, "Complaint does not exist");
        
        Status oldStatus = complaints[_hashId].status;
        complaints[_hashId].status = _status;

        if (_status == Status.ESCALATED) {
            complaints[_hashId].isEscalated = true;
        }

        emit StatusUpdated(_hashId, oldStatus, _status, block.timestamp);
    }

    function escalateComplaint(string memory _hashId) external onlyOwner {
        require(complaints[_hashId].exists, "Complaint does not exist");
        require(!complaints[_hashId].isEscalated, "Already escalated");

        complaints[_hashId].isEscalated = true;
        complaints[_hashId].status = Status.ESCALATED;

        emit Escalated(_hashId, block.timestamp);
        emit StatusUpdated(_hashId, complaints[_hashId].status, Status.ESCALATED, block.timestamp);
    }

    function getComplaint(string memory _hashId) external view returns (string memory, Status, uint256, bool) {
        require(complaints[_hashId].exists, "Complaint does not exist");
        Complaint memory c = complaints[_hashId];
        return (c.ipfsHash, c.status, c.timestamp, c.isEscalated);
    }
}
