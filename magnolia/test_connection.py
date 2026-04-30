import httpx
import time

def test_jupiter():
    url = "https://quote-api.jup.ag/v6/quote"
    params = {
        "inputMint": "So11111111111111111111111111111111111111112",
        "outputMint": "EPjFW36vnC7H1VSEmG6vSP9nbt1uEAL65951Pn666ob",
        "amount": "10000000",
        "slippageBps": 50
    }
    
    print("📡 Verbinding met Jupiter API testen...")
    for i in range(3):
        try:
            res = httpx.get(url, params=params, timeout=10.0)
            if res.status_code == 200:
                print(f"✅ Poging {i+1}: Jupiter API is BEREIKBAAR!")
                return True
            else:
                print(f"⚠️ Poging {i+1}: Jupiter gaf status {res.status_code}")
        except Exception as e:
            print(f"❌ Poging {i+1}: Verbinding mislukt: {e}")
        time.sleep(2)
    return False

if __name__ == "__main__":
    if test_jupiter():
        print("\n🚀 Alle systemen zijn groen. Magnolia kan veilig herstarten.")
    else:
        print("\n🛑 Netwerkprobleem gedetecteerd. Controleer je internetverbinding.")
