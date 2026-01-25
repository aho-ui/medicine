pragma solidity ^0.8.0;

contract MedicineVerification {
    address public admin;

    struct Verification {
        string imageHash;
        string detectionsJson;
        uint256 timestamp;
        address recorder;
    }

    Verification[] public verifications;
    mapping(bytes32 => bool) public imageHashExists;
    mapping(bytes32 => uint256) public imageHashToId;

    event VerificationRecorded(
        uint256 indexed id,
        string imageHash,
        uint256 detectionCount,
        address recorder
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function getVerificationByHash(string memory _imageHash) public view returns (
        uint256 id,
        bool exists
    ) {
        bytes32 hashKey = keccak256(abi.encodePacked(_imageHash));
        return (imageHashToId[hashKey], imageHashExists[hashKey]);
    }

    function recordVerification(
        string memory _imageHash,
        string memory _detectionsJson,
        uint256 _detectionCount
    ) public onlyAdmin returns (uint256) {
        bytes32 hashKey = keccak256(abi.encodePacked(_imageHash));
        require(!imageHashExists[hashKey], "Image already verified");

        uint256 id = verifications.length;

        imageHashExists[hashKey] = true;
        imageHashToId[hashKey] = id;

        verifications.push(Verification({
            imageHash: _imageHash,
            detectionsJson: _detectionsJson,
            timestamp: block.timestamp,
            recorder: msg.sender
        }));

        emit VerificationRecorded(id, _imageHash, _detectionCount, msg.sender);

        return id;
    }

    function getVerification(uint256 _id) public view returns (
        string memory imageHash,
        string memory detectionsJson,
        uint256 timestamp,
        address recorder
    ) {
        require(_id < verifications.length, "Verification not found");
        Verification memory v = verifications[_id];
        return (v.imageHash, v.detectionsJson, v.timestamp, v.recorder);
    }

    function getVerificationCount() public view returns (uint256) {
        return verifications.length;
    }
}
