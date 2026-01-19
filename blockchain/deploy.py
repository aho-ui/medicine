import os
import json
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from solcx import compile_source, install_solc

load_dotenv()

install_solc('0.8.0')

BASE_DIR = Path(__file__).parent
CONTRACT_PATH = BASE_DIR / 'contracts' / 'MedicineVerification.sol'

GANACHE_URL = os.getenv('BLOCKCHAIN_URL', 'http://127.0.0.1:8545')
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY')

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if not w3.is_connected():
    print("Failed to connect to Ganache")
    exit(1)

print(f"Connected to Ganache at {GANACHE_URL}")

with open(CONTRACT_PATH, 'r') as f:
    contract_source = f.read()

compiled = compile_source(contract_source, solc_version='0.8.0')
contract_interface = compiled['<stdin>:MedicineVerification']

bytecode = contract_interface['bin']
abi = contract_interface['abi']

admin_account = w3.eth.account.from_key(ADMIN_PRIVATE_KEY)
print(f"Deploying from: {admin_account.address}")

Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

tx = Contract.constructor().build_transaction({
    'from': admin_account.address,
    'nonce': w3.eth.get_transaction_count(admin_account.address),
    'gas': 2000000,
    'gasPrice': w3.eth.gas_price
})

signed_tx = w3.eth.account.sign_transaction(tx, ADMIN_PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
contract_address = tx_receipt.contractAddress

print(f"Contract deployed at: {contract_address}")

with open(BASE_DIR / 'contract_abi.json', 'w') as f:
    json.dump(abi, f, indent=2)

with open(BASE_DIR / 'contract_address.txt', 'w') as f:
    f.write(contract_address)

print("Saved ABI to contract_abi.json")
print("Saved address to contract_address.txt")
