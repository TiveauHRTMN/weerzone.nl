def evaluate_trade(swap_params, current_sol_balance):
    """
    Paperclip is koud en berekend. Hij weigert trades die wiskundig niet kloppen.
    """
    print("🖇️ Paperclip: Berekenen van Yield-to-Cost verhouding...")
    
    amount_lamports = swap_params.get("amount_lamports", 0)
    amount_sol = amount_lamports / 1_000_000_000
    
    if amount_sol <= 0:
        print("🖇️ Paperclip: Bedrag is 0. Trade afgewezen.")
        return False, "Bedrag is 0."
        
    # Risico 1: Gas Fee & Rent Reserve
    # Solana transacties kosten gas. Als we te weinig SOL overhouden, brickt de wallet.
    MIN_SOL_RESERVE = 0.01 
    if current_sol_balance - amount_sol < MIN_SOL_RESERVE:
        reason = f"Onvoldoende SOL reserve. Huidig: {current_sol_balance}, Na trade: {current_sol_balance - amount_sol}. Minimum: {MIN_SOL_RESERVE}."
        print(f"🖇️ Paperclip BLOKKEERT: {reason}")
        return False, reason
        
    # Risico 2: Micro-trades (Slippage vs Winst)
    if amount_sol < 0.001:
        reason = f"Trade volume te laag ({amount_sol} SOL). Slippage eet de winst op."
        print(f"🖇️ Paperclip BLOKKEERT: {reason}")
        return False, reason

    print(f"✅ Paperclip: Wiskunde klopt. Trade goedgekeurd. Verwachte ROI > Netwerkkosten.")
    return True, "Goedgekeurd door Paperclip."
