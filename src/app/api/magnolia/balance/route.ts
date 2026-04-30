import { NextResponse } from 'next/server';

export async function GET() {
  const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL;
  const WALLET_ADDRESS = process.env.MAGNOLIA_WALLET_ADDRESS || "DkXHDeAjgXWKFcqpG7ziJ4D9gWEW5ifxjNfq3A6kJg1K";

  if (!HELIUS_RPC_URL) {
    console.error("❌ Magnolia API Error: HELIUS_RPC_URL is missing in environment variables.");
    return NextResponse.json({ error: "HELIUS_RPC_URL not configured" }, { status: 500 });
  }

  try {
    // 1. Haal SOL balans op
    const solResponse = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'magnolia-sol',
        method: 'getBalance',
        params: [WALLET_ADDRESS],
      }),
    });
    
    if (!solResponse.ok) {
        throw new Error(`Helius SOL request failed: ${solResponse.status}`);
    }

    const solData = await solResponse.json();
    const solBalance = (solData.result?.value || 0) / 1000000000;

    // 2. Haal token balans (USDC) op - Gebruik de juiste mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    const tokensResponse = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'magnolia-tokens',
        method: 'getTokenAccountsByOwner',
        params: [
          WALLET_ADDRESS,
          { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }, 
          { encoding: 'jsonParsed' }
        ],
      }),
    });

    if (!tokensResponse.ok) {
        throw new Error(`Helius Tokens request failed: ${tokensResponse.status}`);
    }

    const tokensData = await tokensResponse.json();
    let usdcBalance = 0;
    
    if (tokensData.result?.value && tokensData.result.value.length > 0) {
        usdcBalance = tokensData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }

    return NextResponse.json({
        sol: solBalance,
        usdc: usdcBalance,
        wallet: WALLET_ADDRESS,
        timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Magnolia API Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
