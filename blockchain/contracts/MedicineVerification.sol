pragma solidity ^0.8.0;

contract MedicineVerification {
    address public admin;

    struct Verification {
        string imageHash;
        string result;
        uint256 confidence;
        uint256 timestamp;
        address recorder;
    }

    Verification[] public verifications;

    event VerificationRecorded(
        uint256 indexed id,
        string imageHash,
        string result,
        uint256 confidence,
        address recorder
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function recordVerification(
        string memory _imageHash,
        string memory _result,
        uint256 _confidence
    ) public onlyAdmin returns (uint256) {
        uint256 id = verifications.length;

        verifications.push(Verification({
            imageHash: _imageHash,
            result: _result,
            confidence: _confidence,
            timestamp: block.timestamp,
            recorder: msg.sender
        }));

        emit VerificationRecorded(id, _imageHash, _result, _confidence, msg.sender);

        return id;
    }

    function getVerification(uint256 _id) public view returns (
        string memory imageHash,
        string memory result,
        uint256 confidence,
        uint256 timestamp,
        address recorder
    ) {
        require(_id < verifications.length, "Verification not found");
        Verification memory v = verifications[_id];
        return (v.imageHash, v.result, v.confidence, v.timestamp, v.recorder);
    }

    function getVerificationCount() public view returns (uint256) {
        return verifications.length;
    }
}
