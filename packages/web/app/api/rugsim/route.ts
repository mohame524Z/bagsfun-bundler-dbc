import { NextRequest, NextResponse } from 'next/server';

interface RugSimulation {
  simulationType: 'liquidity_removal' | 'mint_exploit' | 'trading_freeze';
  tokenAddress: string;
  params: Record<string, any>;
  results: {
    success: boolean;
    losses: number;
    detectionTime: number;
    exitSuccess: boolean;
    message: string;
  };
}

function simulateLiquidityRemoval(params: any) {
  const lpRemovalPercent = params.lpRemovalPercent || 100;
  const userHolding = params.userHolding || 1.0;
  const priceImpact = lpRemovalPercent * 0.95; // Almost total loss

  const losses = userHolding * (priceImpact / 100);
  const detectionTime = 500 + Math.random() * 2000; // 0.5-2.5s
  const exitSuccess = detectionTime < 1500 && lpRemovalPercent < 80;

  return {
    success: true,
    losses: exitSuccess ? losses * 0.3 : losses,
    detectionTime: Math.round(detectionTime),
    exitSuccess,
    message: exitSuccess
      ? `Early detection! Exited with ${((1 - losses * 0.3 / userHolding) * 100).toFixed(1)}% of funds saved`
      : `Rug detected too late. Lost ${losses.toFixed(4)} SOL (${(losses / userHolding * 100).toFixed(1)}%)`,
  };
}

function simulateMintExploit(params: any) {
  const mintAmount = params.mintAmount || 1000000;
  const userHolding = params.userHolding || 1.0;
  const dilution = mintAmount / (mintAmount + 1000000); // Original supply: 1M

  const losses = userHolding * dilution;
  const detectionTime = 1000 + Math.random() * 3000;
  const exitSuccess = detectionTime < 2000;

  return {
    success: true,
    losses: exitSuccess ? losses * 0.5 : losses,
    detectionTime: Math.round(detectionTime),
    exitSuccess,
    message: exitSuccess
      ? `Mint detected! Exited before major dump with ${((1 - losses * 0.5 / userHolding) * 100).toFixed(1)}% preserved`
      : `Mint exploit completed before exit. Lost ${losses.toFixed(4)} SOL to dilution`,
  };
}

function simulateTradingFreeze(params: any) {
  const userHolding = params.userHolding || 1.0;
  const freezeDuration = params.freezeDuration || 3600; // seconds
  const detectionTime = 100 + Math.random() * 500;

  const exitSuccess = false; // Can't exit if trading is frozen
  const losses = userHolding; // Total loss

  return {
    success: true,
    losses,
    detectionTime: Math.round(detectionTime),
    exitSuccess,
    message: `Trading frozen! All ${userHolding.toFixed(4)} SOL is locked. Rug detection time: ${Math.round(detectionTime)}ms`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { simulationType, tokenAddress, params } = body;

    let results;

    switch (simulationType) {
      case 'liquidity_removal':
        results = simulateLiquidityRemoval(params);
        break;
      case 'mint_exploit':
        results = simulateMintExploit(params);
        break;
      case 'trading_freeze':
        results = simulateTradingFreeze(params);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid simulation type' }, { status: 400 });
    }

    const simulation: RugSimulation = {
      simulationType,
      tokenAddress,
      params,
      results,
    };

    return NextResponse.json({ success: true, simulation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
