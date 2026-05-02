import httpx

JLP_STATS_URL = "https://stats.jup.ag/jlp-stats"

def get_jlp_yield():
    """
    Retrieves the current JLP (Jupiter Liquidity Provider) yield and stats.
    This is Protocol 2: The Banker.
    """
    print("🏦 Banker: Checking JLP (Casinohouder) yield...")
    
    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.get(JLP_STATS_URL)
            res.raise_for_status()
            data = res.json()
            
            # De nieuwe stats API heeft een andere structuur
            return {
                "apy": data.get("apy", 0) / 100, # Converteren naar float (bijv 0.35 voor 35%)
                "tvl": data.get("aum", 0),
                "fees_24h": 0 # Deze API geeft geen direct fees_24h veld, maar we hebben APY
            }
            
    except Exception as e:
        print(f"❌ Banker: JLP yield check failed: {e}")
        return None

if __name__ == "__main__":
    y = get_jlp_yield()
    if y:
        print(f"JLP APY: {y['apy']:.2f}% | TVL: ${y['tvl']/1e6:.2f}M | Fees 24h: ${y['fees_24h']:.2f}")
