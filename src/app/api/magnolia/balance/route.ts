import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/founders";

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;
const WALLET_ADDRESS = process.env.MAGNOLIA_WALLET_ADDRESS || "DkXHDeAjgXWKFcqpG7ziJ4D9gWEW5ifxjNfq3A6kJg1K";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isFounderEmail(user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!HELIUS_RPC_URL) {
    return NextResponse.json({ error: "HELIUS_RPC_URL not configured" }, { status: 500 });
  }

  try {
    // Haal SOL balans op
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
    
    const solData = await solResponse.json();
    const solBalance = (solData.result?.value || 0) / 1000000000;

    // Haal token balans (USDC) op
    const tokensResponse = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'magnolia-tokens',
        method: 'getTokenAccountsByOwner',
        params: [
          WALLET_ADDRESS,
          { mint: 'EPjFW36vnC7H1VSEmG6vSP9nbt1uEAL65951Pn666ob' }, // USDC mint
          { encoding: 'jsonParsed' }
        ],
      }),
    });

    const tokensData = await tokensResponse.json();
    let usdcBalance = 0;
    
    if (tokensData.result?.value && tokensData.result.value.length > 0) {
        usdcBalance = tokensData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }

    return NextResponse.json({
        sol: solBalance,
        usdc: usdcBalance,
        wallet: WALLET_ADDRESS
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
