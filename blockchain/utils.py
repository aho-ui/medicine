import os
import json
import hashlib
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

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

def record_verification(image_hash, result, confidence):
    contract = get_contract()
    admin = w3.eth.account.from_key(ADMIN_PRIVATE_KEY)

    count_before = contract.functions.getVerificationCount().call()

    tx = contract.functions.recordVerification(
        image_hash,
        result,
        int(confidence * 100)
    ).build_transaction({
        "from": admin.address,
        "nonce": w3.eth.get_transaction_count(admin.address),
        "gas": 500000,
        "gasPrice": w3.eth.gas_price
    })

    signed_tx = w3.eth.account.sign_transaction(tx, ADMIN_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "tx_hash": receipt.transactionHash.hex(),
        "block": receipt.blockNumber,
        "verification_id": count_before
    }

def get_verification(verification_id):
    contract = get_contract()
    result = contract.functions.getVerification(verification_id).call()
    return {
        'image_hash': result[0],
        'result': result[1],
        'confidence': result[2] / 100,
        'timestamp': result[3],
        'recorder': result[4]
    }

def get_all_verifications():
    contract = get_contract()
    count = contract.functions.getVerificationCount().call()
    return [get_verification(i) for i in range(count)]
