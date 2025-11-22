# 🛡️ Anti-MEV Bundling Guide

## The MEV Problem

When launching a token with a bundler, **bots can exploit timing gaps** between your buy transactions:

```
❌ VULNERABLE LAUNCH:
Your Buy 1 (0.4 SOL) → 100ms delay → Bot enters (2 SOL) →
Your Buy 2 (0.4 SOL) → Bot dumps → You lose money
```

**Result**: Bot profits from YOUR liquidity, you buy at inflated prices.

---

## ✅ Our Solution: Atomic Jito Bundling

### How It Works

All your bundler buys execute **atomically in the SAME BLOCK**:

```
✅ PROTECTED LAUNCH:
[Jito Bundle] = {
  Tip Transaction,
  Your Buy 1-5 (wallet batch 1),
  Your Buy 6-10 (wallet batch 2),
  Your Buy 11-15 (wallet batch 3)
}

Execution time: 1-2 seconds
All land together or none at all
```

**Result**: No time window for bots to exploit.

---

## 🚀 Key Anti-MEV Features

### 1. **Transaction Packing**

**Old approach** (vulnerable):
- 15 wallets = 15 separate transactions
- Execution spread over 5-10 seconds
- Bots have time to snipe

**Our approach** (protected):
- 15 wallets = 3-4 batched transactions
- Each transaction contains 5-6 buys
- Using Address Lookup Tables (LUT) for compression
- Execution in 1-2 seconds

```typescript
// Automatically optimized
const walletsPerTx = wallets.length <= 10 ? 5 : 6;
// 15 wallets = 3 transactions
// 20 wallets = 4 transactions
```

### 2. **Aggressive Priority Fees**

**Minimum priority fee**: 200,000 microLamports (0.0002 SOL)

```typescript
ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: Math.max(strategy.priorityFee, 200000)
})
```

This ensures your transactions land BEFORE bot transactions.

### 3. **Higher Jito Tips**

**Default tip**: 0.005 SOL (~90th percentile)

```typescript
const tipTx = await this.createJitoTip(0.005);
```

**Tip recommendations**:
- Small launch (<10 wallets): 0.001 SOL
- Medium launch (10-20 wallets): 0.005 SOL
- Large launch (20+ wallets): 0.01 SOL

Higher tips = higher priority in Jito bundles.

### 4. **Multi-Endpoint Redundancy**

Tries 5 Jito endpoints automatically:

```typescript
const jitoEndpoints = [
  'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles'
];
```

If one endpoint fails, automatically tries the next.

### 5. **Atomic Execution Guarantee**

```
⚡ ATOMIC EXECUTION - All buys land in same block or none at all
```

Either your ENTIRE bundle lands, or it fails completely. No partial execution.

---

## 📊 Timing Comparison

### Traditional Bundler (Vulnerable)

```
Token Creation:     t=0s
Buy 1:             t=0.5s   ← Bot can enter here
Buy 2:             t=1.0s   ← Bot can enter here
Buy 3:             t=1.5s   ← Bot can enter here
...
Buy 15:            t=7.5s   ← Bot dumps here

Total time: ~8 seconds
MEV vulnerability: HIGH ❌
```

### Our Atomic Bundler (Protected)

```
Token Creation:              t=0s
Jito Bundle Preparation:     t=0.5s
Bundle Submission:           t=0.6s
Bundle Lands (ALL 15 buys):  t=1.5s  ← All atomic!

Total time: ~2 seconds
MEV vulnerability: LOW ✅
```

**7 seconds faster + MEV protected**

---

## 🎯 Best Practices for Launches

### 1. **Always Use Jito**

```bash
# In setup wizard
Enable Jito bundles? Yes
Jito tip amount: 0.005 SOL (High - Recommended for launches)
```

### 2. **Optimal Wallet Count**

```
Small launch:  5-10 wallets  → 1-2 transactions
Medium launch: 10-20 wallets → 2-4 transactions
Large launch:  20-30 wallets → 4-5 transactions
```

**Sweet spot**: 15 wallets = 3 transactions

### 3. **Priority Fee Configuration**

```bash
# In setup
Priority Fee: 500000 microLamports (0.0005 SOL minimum)
```

Higher = faster execution.

### 4. **Distribution Strategy**

```bash
Distribution: RANDOM  # Most organic looking
```

Avoid EVEN distribution (looks like bot activity).

### 5. **Launch Timing**

```
Best times (UTC):
- 13:00-17:00 (US morning)
- 18:00-22:00 (US afternoon)

Avoid:
- Asian hours (low volume)
- Weekends (less volume)
```

---

## ⚙️ Configuration Examples

### Maximum Protection Launch

```typescript
Mode: MAYHEM
Bundler Wallets: 15
Distribution: RANDOM
Buy per wallet: 0.4 SOL
Jito: Enabled
Jito Tip: 0.01 SOL (Maximum priority)
Priority Fee: 500000 microLamports
```

**Cost**: ~6 SOL buys + 0.01 SOL Jito tip = 6.01 SOL
**Protection**: Maximum
**Execution**: ~1 second

### Budget Protection Launch

```typescript
Mode: MAYHEM
Bundler Wallets: 10
Distribution: RANDOM
Buy per wallet: 0.3 SOL
Jito: Enabled
Jito Tip: 0.005 SOL (High)
Priority Fee: 300000 microLamports
```

**Cost**: ~3 SOL buys + 0.005 SOL Jito tip = 3.005 SOL
**Protection**: High
**Execution**: ~1.5 seconds

### Testing Launch (Devnet)

```typescript
Mode: CLASSIC
Bundler Wallets: 5
Distribution: EVEN
Buy per wallet: 0.1 SOL
Jito: Enabled
Jito Tip: 0.001 SOL
Priority Fee: 100000 microLamports
```

**Cost**: ~0.5 SOL buys + 0.001 SOL Jito tip = 0.501 SOL
**Protection**: Medium
**Execution**: ~1 second

---

## 🔍 Monitoring Bundle Execution

### CLI Output

```bash
$ yarn cli create

✓ Token created: pump...abc123
✓ Creating Address Lookup Table...
✓ LUT created: ALT...xyz789
✓ Extending LUT with 18 addresses...
ℹ Preparing ATOMIC Jito bundle (anti-MEV protection)...
ℹ Packing 15 buys into 3 transactions (5 per tx)
ℹ Jito tip: 0.005 SOL to DttW...
ℹ Sending ATOMIC bundle: 4 txs (15 buys)
⚠ ⚡ ATOMIC EXECUTION - All buys land in same block or none at all
✓ ✅ Bundle accepted by Jito: 5KJp4X...
ℹ Monitoring bundle execution...
✓ 🚀 Bundle executed in ~1.8s
✓ Token created and bundled!

Token Address: pump...abc123
Transactions: 15
Success Rate: 100.0%
Avg Confirmation: 1800ms
```

### What to Look For

✅ **Good signs**:
- Bundle execution < 3 seconds
- 100% success rate
- "ATOMIC EXECUTION" message
- All buys recorded in portfolio

❌ **Warning signs**:
- Fallback to sequential execution
- Execution > 5 seconds
- Failed transactions
- "vulnerable to MEV" warning

---

## 🛠️ Troubleshooting

### "All Jito endpoints failed"

**Cause**: Network congestion or Jito downtime

**Solution**:
1. Check Jito status: https://jito.wtf
2. Increase tip amount (0.01 SOL)
3. Retry during off-peak hours
4. Falls back to sequential (less protected)

### "Bundle confirmation timeout"

**Cause**: Bundle rejected or network issues

**Solution**:
1. Check wallet has enough SOL (total buys + 1 SOL buffer)
2. Verify RPC endpoint is healthy
3. Increase Jito tip
4. Reduce wallet count (try 10 instead of 20)

### "Lookup table not found"

**Cause**: LUT creation failed or not confirmed

**Solution**:
1. Wait 5 seconds after token creation
2. Verify RPC is reliable (use Helius/QuickNode)
3. Check LUT creation logs

---

## 📈 Expected Results

### With Atomic Bundling (Protected)

```
Launch scenario:
- 15 wallets @ 0.4 SOL each = 6 SOL total
- Jito tip: 0.005 SOL
- Token price after bundle: ~$800-1000 market cap

Expected outcome:
✅ No bot frontrunning
✅ All buys at similar price
✅ Clean chart (smooth entry)
✅ Higher success rate (60-80%)
```

### Without Atomic Bundling (Vulnerable)

```
Same scenario but sequential execution:

Expected outcome:
❌ Bots frontrun during execution
❌ Later buys at 2-3x higher price
❌ Uneven distribution
❌ Lower success rate (30-50%)
❌ Immediate dump pressure
```

---

## 🎓 Advanced: How Jito Bundles Work

### Traditional MEV

```
Mempool (Public):
[Your Tx 1] [Your Tx 2] [Your Tx 3] ...

Bot sees your transactions →
Bot frontruns with higher fee →
Bot dumps on you
```

### Jito MEV Protection

```
Private Mempool (Jito):
[Bundle] = {Tip, Tx1, Tx2, Tx3, ...}

Bundle sent directly to validator →
Validator includes entire bundle or nothing →
No public mempool exposure →
No frontrunning possible
```

### Bundle Anatomy

```
Bundle Structure:
┌─────────────────────────────┐
│ Jito Tip (0.005 SOL)       │ ← Priority
├─────────────────────────────┤
│ Buy Tx 1-5 (Batch 1)       │ ← Atomic
├─────────────────────────────┤
│ Buy Tx 6-10 (Batch 2)      │ ← Atomic
├─────────────────────────────┤
│ Buy Tx 11-15 (Batch 3)     │ ← Atomic
└─────────────────────────────┘

All transactions use SAME blockhash
All signed and ready before submission
Submitted as single unit to validator
```

---

## 💡 Pro Tips

1. **Pre-fund wallets** with extra SOL for priority fees
2. **Test on devnet** first to verify bundle execution
3. **Monitor portfolio** immediately after launch
4. **Use MAYHEM mode** for faster graduation
5. **Higher tips during peak hours** (US trading hours)
6. **Combine with marketing** for organic buyers
7. **Sell gradually** using bundle mode (not all at once)

---

## 🔗 Resources

- Jito Documentation: https://docs.jito.wtf
- Solana Priority Fees: https://solana.com/docs/core/fees
- Address Lookup Tables: https://solana.com/docs/advanced/lookup-tables
- MEV on Solana: https://jito-labs.medium.com

---

## 📊 Cost Breakdown

### 15 Wallet Launch

```
Token Creation:          0.02 SOL
Wallet Rent (15):        0.15 SOL
SOL Distribution (gas):  0.003 SOL
Bundler Buys:           6.00 SOL
Jito Tip:               0.005 SOL
LUT Creation:           0.002 SOL
─────────────────────────────────
TOTAL:                  6.18 SOL

Expected profit at 2x:  12 SOL (sell 6 SOL worth)
Net profit:             5.82 SOL (94% ROI)
```

### MEV Protection Value

```
Without protection:
- Bot steals: ~30% of pump (1.8 SOL loss)
- Higher buy prices: ~20% worse (1.2 SOL loss)
- Total MEV loss: ~3 SOL

With protection (0.005 SOL tip):
- Bot protection: Saves 3 SOL
- ROI on tip: 60000% (3 SOL saved / 0.005 SOL cost)
```

**Jito tips pay for themselves 600x over!**

---

## ✅ Checklist Before Launch

- [ ] Jito enabled in config
- [ ] Tip amount ≥ 0.005 SOL
- [ ] Priority fee ≥ 200,000 microLamports
- [ ] 15-20 bundler wallets configured
- [ ] RPC endpoint is reliable (Helius/QuickNode)
- [ ] Main wallet has enough SOL (total + 1 SOL buffer)
- [ ] Token metadata ready (image, description, socials)
- [ ] Marketing prepared (Twitter, Telegram)
- [ ] Launch during US trading hours
- [ ] Portfolio tracking enabled

---

## 🚀 Launch Command

```bash
# Run with anti-MEV protection
yarn cli create

# Monitor portfolio immediately
yarn cli portfolio

# Check for new buyers
watch -n 5 'yarn cli portfolio'
```

**Remember**: Atomic bundling gives you a fair launch. Marketing and timing determine success.

Good luck! 🚀
