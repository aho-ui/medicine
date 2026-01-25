import os
import json
import hashlib
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

try:
    from vision.models import BlockchainAddress
except ImportError:
    BlockchainAddress = None

BASE_DIR = Path(__file__).parent
ABI_PATH = BASE_DIR / 'contract_abi.json'
ADDRESS_PATH = BASE_DIR / 'contract_address.txt'

GANACHE_URL = os.getenv('BLOCKCHAIN_URL', 'http://127.0.0.1:8545')
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY')

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

def get_contract():
    with open(ABI_PATH, 'r') as f:
        abi = json.load(f)
    with open(ADDRESS_PATH, 'r') as f:
        address = f.read().strip()
    return w3.eth.contract(address=address, abi=abi)

def hash_image(image_bytes):
    return hashlib.sha256(image_bytes).hexdigest()

def check_hash_exists(image_hash):
    """Check if image hash already exists in blockchain."""
    try:
        contract = get_contract()
        verification_id, exists = contract.functions.getVerificationByHash(image_hash).call()
        return exists, verification_id
    except Exception:
        return False, None

def record_verification(image_hash, detections):
    try:
        if not w3.is_connected():
            raise Exception("Ganache not running. Start Ganache on port 8545")

        if BlockchainAddress:
            cached = BlockchainAddress.objects.filter(image_hash=image_hash).first()
            if cached:
                return {
                    "tx_hash": cached.tx_hash,
                    "block": cached.block_number,
                    "verification_id": cached.verification_id,
                    "already_verified": True
                }

        exists, verification_id = check_hash_exists(image_hash)
        if exists:
            existing = get_verification(verification_id)
            return {
                "tx_hash": f"existing (timestamp: {existing['timestamp']})",
                "block": 0,
                "verification_id": verification_id,
                "already_verified": True
            }

        contract = get_contract()
        admin = w3.eth.account.from_key(ADMIN_PRIVATE_KEY)

        count_before = contract.functions.getVerificationCount().call()

        detections_json = json.dumps(detections)
        detection_count = len(detections)

        tx = contract.functions.recordVerification(
            image_hash,
            detections_json,
            detection_count
        ).build_transaction({
            "from": admin.address,
            "nonce": w3.eth.get_transaction_count(admin.address),
            "gas": 3000000,
            "gasPrice": w3.eth.gas_price
        })

        signed_tx = w3.eth.account.sign_transaction(tx, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        verification = get_verification(count_before)

        if BlockchainAddress:
            BlockchainAddress.objects.create(
                image_hash=image_hash,
                verification_id=count_before,
                tx_hash=receipt.transactionHash.hex(),
                block_number=receipt.blockNumber,
                timestamp=verification['timestamp']
            )

        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block": receipt.blockNumber,
            "verification_id": count_before,
            "already_verified": False
        }
    except FileNotFoundError:
        raise Exception("Blockchain contract not deployed. Run: python blockchain/deploy.py")
    except Exception as e:
        if "Ganache" in str(e):
            raise
        raise Exception(f"Blockchain error: {str(e)}")

def get_verification(verification_id):
    contract = get_contract()
    result = contract.functions.getVerification(verification_id).call()
    return {
        'image_hash': result[0],
        'detections': json.loads(result[1]),
        'timestamp': result[2],
        'recorder': result[3]
    }

def get_all_verifications():
    contract = get_contract()
    count = contract.functions.getVerificationCount().call()
    return [get_verification(i) for i in range(count)]
