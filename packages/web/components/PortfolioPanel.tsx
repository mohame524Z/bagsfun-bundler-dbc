'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PumpMode } from '@pump-bundler/types';

interface PortfolioPanelProps {
  connection: Connection;
  mode: PumpMode;
}

interface TokenHolding {
  tokenAddress: string;
  symbol: string;
  totalAmount: number;
  averagePrice: number;
  currentValue: number;
  unrealizedPnL: number;
  walletCount: number;
}

interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  totalBuys: number;
  totalSells: number;
  uniqueTokens: number;
}

export default function PortfolioPanel({ connection, mode }: PortfolioPanelProps) {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load portfolio');
      }

      // Transform API response to component state
      const totalPnL = data.portfolio.unrealizedPnL + data.portfolio.realizedPnL;
      const pnlPercentage = data.portfolio.totalInvested > 0
        ? ((totalPnL / data.portfolio.totalInvested) * 100)
        : 0;

      setPortfolio({
        totalInvested: data.portfolio.totalInvested,
        currentValue: data.portfolio.currentValue,
        unrealizedPnL: data.portfolio.unrealizedPnL,
        realizedPnL: data.portfolio.realizedPnL,
        totalPnL,
        pnlPercentage,
        totalBuys: data.stats.totalBuys,
        totalSells: data.stats.totalSells,
        uniqueTokens: data.stats.uniqueTokens,
      });

      setHoldings(data.portfolio.tokens);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [publicKey]);

  const formatSOL = (amount: number) => {
    return amount.toFixed(4);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Overall Performance Card */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          💼 Portfolio Overview
          <button
            onClick={loadPortfolio}
            disabled={loading}
            className="ml-auto text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </div>
            ) : (
              '↻ Refresh'
            )}
          </button>
        </h2>

        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Invested */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Invested</p>
              <p className="text-2xl font-bold text-white">
                {formatSOL(portfolio.totalInvested)} SOL
              </p>
            </div>

            {/* Current Value */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Current Value</p>
              <p className="text-2xl font-bold text-cyan-400">
                {formatSOL(portfolio.currentValue)} SOL
              </p>
            </div>

            {/* Total PnL */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total PnL</p>
              <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.totalPnL >= 0 ? '+' : ''}{formatSOL(portfolio.totalPnL)} SOL
                <span className="text-sm ml-2">
                  ({portfolio.pnlPercentage >= 0 ? '+' : ''}{portfolio.pnlPercentage.toFixed(2)}%)
                </span>
              </p>
            </div>

            {/* Unrealized PnL */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Unrealized PnL</p>
              <p className={`text-lg font-bold ${portfolio.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.unrealizedPnL >= 0 ? '+' : ''}{formatSOL(portfolio.unrealizedPnL)} SOL
              </p>
            </div>

            {/* Realized PnL */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Realized PnL</p>
              <p className={`text-lg font-bold ${portfolio.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.realizedPnL >= 0 ? '+' : ''}{formatSOL(portfolio.realizedPnL)} SOL
              </p>
            </div>

            {/* Trading Stats */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Trading Stats</p>
              <p className="text-lg font-bold text-white">
                {portfolio.totalBuys} buys / {portfolio.totalSells} sells
              </p>
              <p className="text-sm text-gray-400">{portfolio.uniqueTokens} unique tokens</p>
            </div>
          </div>
        )}
      </div>

      {/* Token Holdings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Token Holdings</h2>

        {holdings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No holdings yet</p>
        ) : (
          <div className="space-y-3">
            {holdings.map((holding) => (
              <div
                key={holding.tokenAddress}
                className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => setSelectedToken(
                  selectedToken === holding.tokenAddress ? null : holding.tokenAddress
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold">{holding.symbol}</h3>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {holding.tokenAddress}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-400">PnL</p>
                    <p className={`text-lg font-bold ${holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.unrealizedPnL >= 0 ? '+' : ''}{formatSOL(holding.unrealizedPnL)} SOL
                    </p>
                  </div>
                </div>

                {selectedToken === holding.tokenAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-sm font-bold">{formatNumber(holding.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Avg Price</p>
                      <p className="text-sm font-bold">{holding.averagePrice.toFixed(8)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Current Value</p>
                      <p className="text-sm font-bold">{formatSOL(holding.currentValue)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Wallets</p>
                      <p className="text-sm font-bold">{holding.walletCount} wallets</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded font-semibold transition-colors">
            💰 Sell Tokens
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-semibold transition-colors">
            📈 Export CSV
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded font-semibold transition-colors">
            💸 Recover Rent
          </button>
        </div>
      </div>
    </div>
  );
}
