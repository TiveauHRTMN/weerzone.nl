import os
import httpx
import base64
import base58
import json
from dotenv import load_dotenv, find_dotenv
from solders.keypair import Keypair
from solders.transaction import VersionedTransaction
from solders.signature import Signature

# Forceer reload van de lokale .env
load_dotenv(find_dotenv(), override=True)

HELIUS_RPC_URL = os.getenv("HELIUS_RPC_URL")
PRIV_KEY = os.getenv("SOLANA_PRIVATE_KEY")

# Alternatieve Jupiter API (betere DNS bereikbaarheid)
JUP_BASE_URL = "https://public.jupiterapi.com"

def get_keypair():
    if not PRIV_KEY: return None
    try:
        clean_key = PRIV_KEY.strip().replace(" ", "").replace("\"", "").replace("'", "")
        if "jouw_" in clean_key: return None
        return Keypair.from_base58_string(clean_key)
    except:
        try:
            decoded = base58.b58decode(clean_key)
            return Keypair.from_bytes(decoded)
        except: return None

def swap(input_mint, output_mint, amount_lamports, slippage_bps=50):
    keypair = get_keypair()
    if not keypair:
        print("❌ Fout: Geen key.")
        return

    try:
        # 1. Get Quote
        print(f"🔄 Magnolia vraagt quote aan via Public Jupiter API...")
        quote_url = f"{JUP_BASE_URL}/quote"
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": amount_lamports,
            "slippageBps": slippage_bps
        }
        
        with httpx.Client(timeout=30.0) as client:
            res = client.get(quote_url, params=params)
            if res.status_code != 200:
                print(f"❌ Jupiter Quote Error: {res.status_code} - {res.text}")
                return None
            quote_data = res.json()
            
            if "outAmount" not in quote_data:
                print(f"❌ Quote mislukt: {quote_data}")
                return

            print(f"✅ Quote ontvangen: {quote_data['outAmount']} tokens.")

            # 2. Get Swap Transaction
            swap_url = f"{JUP_BASE_URL}/swap"
            payload = {
                "quoteResponse": quote_data,
                "userPublicKey": str(keypair.pubkey()),
                "wrapAndUnwrapSol": True,
                "dynamicComputeUnitLimit": True,
                "prioritizationFeeLamports": "auto"
            }
            
            res = client.post(swap_url, json=payload)
            res.raise_for_status()
            swap_data = res.json()
            
            # 3. Sign & Send
            raw_tx = base64.b64decode(swap_data['swapTransaction'])
            tx = VersionedTransaction.from_bytes(raw_tx)
            
            # Sign de message bytes
            signature = keypair.sign_message(bytes(tx.message))
            
            # Reconstruct signed transaction
            signatures = [Signature.default()] * tx.message.header.num_required_signatures
            signatures[0] = signature
            signed_tx = VersionedTransaction.populate(tx.message, signatures)
            
            print("🚀 Verzenden naar Solana...")
            send_payload = {
                "jsonrpc": "2.0", "id": 1, "method": "sendTransaction",
                "params": [
                    base64.b64encode(bytes(signed_tx)).decode('utf-8'), 
                    {"encoding": "base64", "skipPreflight": True}
                ]
            }
            
            final_res = client.post(HELIUS_RPC_URL, json=send_payload)
            result = final_res.json()
            
            if "result" in result:
                print(f"🔥 SUCCES! Transactie: {result['result']}")
                return result['result']
            else:
                print(f"❌ Transactie mislukt: {result}")

    except Exception as e:
        print(f"❌ Syndicaat Executiefout: {e}")
    return None
