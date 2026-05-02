import httpx
import json

GAMMA_API_URL = "https://gamma-api.polymarket.com/markets"

def scan_polymarket_opportunities(limit=10):
    """
    Scans Polymarket for high-probability 'No' outcomes where the 'Yes' price is inflated.
    This is Protocol 3: The Hunter.
    """
    print("🦅 Hunter: Scanning Polymarket for irrational hype...")
    
    # Updated params for better compatibility
    params = {
        "active": "true",
        "closed": "false",
        "limit": limit
    }
    
    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.get(GAMMA_API_URL, params=params)
            res.raise_for_status()
            markets = res.json()
            
            opportunities = []
            for market in markets:
                # Basic 'Hunter' logic: Look for outcomes with high volume and high prices that might be hype-driven
                # In a real scenario, we'd compare this with external news or mathematical models.
                # For now, we report the high-volume markets for Magnolia to analyze.
                
                # Check if it's a binary market (Yes/No)
                outcomes = json.loads(market.get('outcomes', '[]'))
                clob_rewards = market.get('clobTokenIds', '[]')
                
                if len(outcomes) == 2:
                    opportunities.append({
                        "question": market.get('question'),
                        "slug": market.get('slug'),
                        "yes_price": market.get('outcomePrices', [0, 0])[0],
                        "no_price": market.get('outcomePrices', [0, 0])[1],
                        "volume_24h": market.get('volume24h'),
                        "liquidity": market.get('liquidity'),
                        "end_date": market.get('endDate')
                    })
            
            return opportunities
            
    except Exception as e:
        print(f"❌ Hunter: Polymarket scan failed: {e}")
        return []

if __name__ == "__main__":
    opps = scan_polymarket_opportunities()
    for o in opps:
        print(f"Target: {o['question']} | Yes: {o['yes_price']} | No: {o['no_price']} | Vol: {o['volume_24h']}")
