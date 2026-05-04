import os
import json
import time
import sys
import httpx
from google import genai
from google.genai import types

# Het Syndicaat
import config
import check_history
import jupiter_swap
import kiloclaw_scraper
import paperclip_optimizer
import hermes_logger
import kamino_vault
import guardian_jito
import banker_jlp
import hunter_polymarket
import fleet_orchestrator

client = genai.Client(api_key=config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None

def get_market_context():
    wallet = check_history.get_wallet_address()
    if not wallet:
        return {"error": "Geen geldige wallet gevonden."}
    
    print("Market: Balansgegevens ophalen...", flush=True)
    balance_data = check_history.check_balance(wallet)
    
    # KILOCLAW WORDT LOSGELATEN op SOL en Trending
    print("Market: Kiloclaw marktanalyse starten...", flush=True)
    sol_market_data = kiloclaw_scraper.claw_market_data(config.SOL_MINT)
    trending_pairs = kiloclaw_scraper.scan_trending_pairs()

    # 3-HEADED MONSTER DATA GATHERING
    print("Market: 3-Headed Monster tools activeren...", flush=True)
    jito_stats = guardian_jito.get_jito_yield()
    jlp_stats = banker_jlp.get_jlp_yield()
    polymarket_opps = hunter_polymarket.scan_polymarket_opportunities(limit=5)
    
    return {
        "wallet_address": wallet,
        "sol_balance": balance_data.get("sol_balance", 0),
        "tokens": balance_data.get("tokens", []),
        "live_market_data": {"SOL": sol_market_data, "trending": trending_pairs},
        "protocols_data": {
            "guardian_jito": jito_stats,
            "banker_jlp": jlp_stats,
            "hunter_polymarket": polymarket_opps
        },
        "limits": {
            "MIN_SOL_RESERVE": config.MIN_SOL_RESERVE,
            "MAX_TRADE_SOL": config.MAX_TRADE_SOL
        },
        "current_focus": "3-HEADED MONSTER: Passive Income & Asymmetric Arbitrage.",
    }

def get_model_for_task(context, decision_type="routine"):
    """
    Multi-Tier AI Routing:
    - Routine: Gebruik goedkope, snelle Flash modellen.
    - High-Stakes: Gebruik de premium 'Strategist' (Opus 4.7 equivalent).
    """
    if decision_type == "high-stakes":
        # Gebruik de krachtigste 'Opus' variant
        return "claude-3-5-opus-latest" 
    else:
        # Dagelijkse heat-swaps en routine logs
        return "gemini-2.0-flash"

def analyze_and_decide(context):
    # Logica om te bepalen of het een 'high-stakes' besluit is
    is_high_stakes = False
    if len(context.get('protocols_data', {}).get('hunter_polymarket', [])) > 0:
        is_high_stakes = True # Polymarket scan detected, verhoog naar Strategist
        
    model = get_model_for_task(context, "high-stakes" if is_high_stakes else "routine")
    print(f"🧠 Magnolia kiest Strategist: {model}", flush=True)

    prompt = f"""
    Je bent Magnolia, de kapitein van een crypto-vloot.
    Jouw 'Strategist' brein (Opus 4.7) analyseert deze situatie:
    {json.dumps(context, indent=2)}

    DWINGENDE UITVOERINGSREGELS:
    - Directe Actie: Hermes voert alleen trades uit met een wiskundig 'Unfair Advantage'.
    - Geen Ruis: Rapporteer alleen in ROI en concrete getallen.

    Antwoord ALTIJD en ALLEEN in JSON formaat met deze velden:
    {{
        "macro_thesis": "Guardian/Banker/Hunter visie",
        "self_correction_audit": "Ratio vs Emotie check",
        "action": "SWAP" | "HOLD" | "DEPOSIT_KAMINO",
        "params": {{
            "from": "MINT_ADDRESS",
            "to": "MINT_ADDRESS",
            "amount_sol": 0.05
        }},
        "paperclip_memory_note": "Wat moet Paperclip onthouden van deze move?"
    }}
    """
    # ... rest van de functie met de gekozen 'model' variabele ...


    content = None

    if config.OPENROUTER_API_KEY:
        print(f"Magnolia: Syndicaat-data verwerken met {config.OPENROUTER_MODEL} via OpenRouter...", flush=True)
        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": config.OPENROUTER_MODEL,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                res.raise_for_status()
                data = res.json()
                content = data['choices'][0]['message']['content']
        except Exception as e:
            print(f"⚠️ OpenRouter gefaald ({e}). Overschakelen op Gemini Fallback...", flush=True)

    if not content and config.GEMINI_API_KEY:
        print("Magnolia: Syndicaat-data verwerken met Gemini Fallback (Direct API)...", flush=True)
        try:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={config.GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            with httpx.Client(timeout=45.0) as gemini_client:
                gem_res = gemini_client.post(gemini_url, json=payload)
                gem_res.raise_for_status()
                gem_data = gem_res.json()
                content = gem_data['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            print(f"❌ Ook Gemini Fallback gefaald: {e}", flush=True)
            return None

    if not content:
        return None

    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        print(f"❌ JSON Parse Fout: {e}\nContent was: {content}", flush=True)
        return None

def execute_decision(decision, current_sol_balance, tokens):
    if not decision: return
        
    action = decision.get("action")
    print(f"\n🧠 God Mode Thesis: {decision.get('macro_thesis')}", flush=True)
    print(f"⚖️ Audit: {decision.get('self_correction_audit')}", flush=True)
    print(f"⚖️ Action: {action}", flush=True)

    note = decision.get("paperclip_memory_note", "")
    if note:
        fleet_orchestrator.paperclip.remember(note)
    
    is_safe, audit_msg = fleet_orchestrator.paperclip.audit(decision)
    if not is_safe:
        print(f"🛑 Paperclip Veto: {audit_msg}", flush=True)
        return

    if action == "SWAP":
        params = decision.get("params", {})
        try:
            amount_sol = float(params.get('amount_sol', 0.01))
            if amount_sol > config.MAX_TRADE_SOL:
                amount_sol = config.MAX_TRADE_SOL
        except (ValueError, TypeError):
            amount_sol = 0.01
            
        amount_lamports = int(amount_sol * 1_000_000_000)
        target_from = params.get('from', config.SOL_MINT)
        target_to = params.get('to', config.USDC_MINT)
            
        swap_params = {
            "from": target_from,
            "to": target_to,
            "amount_lamports": amount_lamports
        }
        
        is_approved, reason = paperclip_optimizer.evaluate_trade(swap_params, current_sol_balance)
        
        if is_approved:
            print(f"🔄 Magnolia: LIVE SWAP gestart ({amount_sol} SOL)...", flush=True)
            try:
                # 1. Execute swap
                sig = jupiter_swap.swap(swap_params.get('from'), swap_params.get('to'), swap_params.get('amount_lamports'))
                
                if sig:
                    # 2. PEV Protocol: Activeer 30-seconde cooldown en verificatie
                    print(f"⏳ PEV Protocol Geactiveerd: 30 seconden cooldown voor {sig}...", flush=True)
                    time.sleep(30)
                    
                    # 3. Balance ophalen
                    wallet = check_history.get_wallet_address()
                    new_balance = check_history.check_balance(wallet)
                    
                    target_found = False
                    if target_to == config.SOL_MINT:
                        if new_balance.get("sol_balance", 0) > 0: target_found = True
                    else:
                        for t in new_balance.get('tokens', []):
                            if t.get('mint') == target_to and t.get('balance', 0) > 0:
                                target_found = True
                                break
                                
                    # 4. Resultaat beoordelen en loggen
                    if target_found:
                        print("✅ PEV PASSED: Target balans is succesvol geüpdatet.", flush=True)
                        hermes_logger.log_action("Magnolia", "god_mode_trade", f"Syndicaat trade succesvol: {amount_sol} {target_from[:4]} -> {target_to[:4]}. Sig: {sig}")
                    else:
                        print("🚨 PEV FAILED: Target balans onveranderd of 0 na executie.", flush=True)
                        fleet_orchestrator.paperclip.remember(f"FAILED SWAP: PEV Protocol getriggerd. Balans bleef leeg na swap {sig}.")
                        hermes_logger.log_action("Magnolia", "god_mode_trade_failed", f"PEV FAILED. Geen tokens ontvangen voor sig: {sig}")
                        
                        # Hard stop op de huidige executie-thread
                        print("🛑 PEV Protocol blokkeert verdere acties. Systeem wacht op handmatig groen licht.", flush=True)
                        sys.exit(1)
            except Exception as e:
                print(f"⚠️ Executiefout: {e}.", flush=True)
        else:
            print(f"🛑 Paperclip Veto: {reason}", flush=True)

def run_syndicate():
    iteration = 0
    while True:
        print("\n" + "="*45, flush=True)
        print("--- WEERZONE CRYPTO SYNDICAAT - MAGNOLIA FLASH ---", flush=True)
        print("="*45, flush=True)
        
        try:
            context = get_market_context()
            if "error" not in context:
                if iteration % 5 == 0:
                    sol_bal = context.get('sol_balance', 0)
                    hermes_logger.log_action("Magnolia", "system_check", f"God Mode online. Balans: {sol_bal:.4f} SOL", status="active")
                
                decision = analyze_and_decide(context)
                if decision:
                    execute_decision(decision, context.get('sol_balance', 0), context.get('tokens', []))
                else:
                    print("⚠️ Magnolia kon geen besluit nemen.", flush=True)
            
            iteration += 1
        except Exception as e:
            print(f"❌ Systeemfout: {e}", flush=True)

        print("\n😴 Magnolia rust (15m)...", flush=True)
        time.sleep(900)

if __name__ == "__main__":
    run_syndicate()
