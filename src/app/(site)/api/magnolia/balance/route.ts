import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  JLP: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
} as const;

type TokenSymbol = keyof typeof TOKEN_MINTS;

async function fetchTokenPriceUsd(mint: string) {
  if (mint === TOKEN_MINTS.USDC) return 1;

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return 0;

    const data = await res.json();
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
    const bestPair = pairs
      .filter((pair: any) => pair?.priceUsd)
      .sort((a: any, b: any) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0))[0];

    return Number(bestPair?.priceUsd || 0);
  } catch {
    return 0;
  }
}

export async function GET() {
  const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL;
  const WALLET_ADDRESS = process.env.MAGNOLIA_WALLET_ADDRESS || 'DkXHDeAjgXWKFcqpG7ziJ4D9gWEW5ifxjNfq3A6kJg1K';

  if (!HELIUS_RPC_URL) {
    console.error('Magnolia API Error: HELIUS_RPC_URL is missing in environment variables.');
    return NextResponse.json({ error: 'HELIUS_RPC_URL not configured' }, { status: 500 });
  }

  try {
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
    const solBalance = (solData.result?.value || 0) / 1_000_000_000;

    const tokensResponse = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'magnolia-tokens',
        method: 'getTokenAccountsByOwner',
        params: [
          WALLET_ADDRESS,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    if (!tokensResponse.ok) {
      throw new Error(`Helius Tokens request failed: ${tokensResponse.status}`);
    }

    const tokensData = await tokensResponse.json();
    const balances: Record<TokenSymbol, number> = {
      SOL: solBalance,
      USDC: 0,
      JITOSOL: 0,
      JLP: 0,
    };

    for (const account of tokensData.result?.value || []) {
      const info = account?.account?.data?.parsed?.info;
      const mint = info?.mint;
      const amount = Number(info?.tokenAmount?.uiAmount || 0);

      if (mint === TOKEN_MINTS.USDC) balances.USDC += amount;
      if (mint === TOKEN_MINTS.JITOSOL) balances.JITOSOL += amount;
      if (mint === TOKEN_MINTS.JLP) balances.JLP += amount;
    }

    const prices = {
      SOL: await fetchTokenPriceUsd(TOKEN_MINTS.SOL),
      USDC: 1,
      JITOSOL: await fetchTokenPriceUsd(TOKEN_MINTS.JITOSOL),
      JLP: await fetchTokenPriceUsd(TOKEN_MINTS.JLP),
    };

    const positions = [
      { symbol: 'SOL', balance: balances.SOL, priceUsd: prices.SOL },
      { symbol: 'JitoSOL', balance: balances.JITOSOL, priceUsd: prices.JITOSOL },
      { symbol: 'USDC', balance: balances.USDC, priceUsd: prices.USDC },
      { symbol: 'JLP', balance: balances.JLP, priceUsd: prices.JLP },
    ].map((position) => ({
      ...position,
      valueUsd: Number((position.balance * position.priceUsd).toFixed(4)),
    }));

    const portfolioUsd = Number(positions.reduce((sum, position) => sum + position.valueUsd, 0).toFixed(4));

    return NextResponse.json({
      sol: solBalance,
      usdc: balances.USDC,
      wallet: WALLET_ADDRESS,
      portfolioUsd,
      solUsd: prices.SOL,
      positions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Magnolia API Crash:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
