# Fabriquant Pattern Library

Pre-built execution patterns for common DeFi and AI agent use cases on Solana.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Pattern Categories](#pattern-categories)
  - [AI Trading Agents](#ai-trading-agents)
  - [DAO Treasury Management](#dao-treasury-management)
  - [DeFi Protocols](#defi-protocols)
- [Base Pattern API](#base-pattern-api)
- [Pattern Registry](#pattern-registry)
- [Best Practices](#best-practices)

## Overview

The Fabriquant Pattern Library provides ready-to-use execution templates that combine multiple SDK components (Loom, Guard, FabricCore, Pulsar) to solve common DeFi challenges. Each pattern includes:

- **Pre-configured security**: Integrated Guard validation
- **Optimized execution**: Loom-powered transaction routing
- **Retry logic**: Automatic retry with exponential backoff
- **Metrics tracking**: Built-in performance monitoring
- **Dry-run mode**: Test without executing on-chain

## Getting Started

### Installation

```typescript
import {
  GridTradingPattern,
  SwapPattern,
  TreasuryRebalancing,
  Guard,
} from '@fabriquant/sdk';
```

### Basic Usage

All patterns follow the same execution model:

```typescript
// 1. Create pattern with configuration
const pattern = new GridTradingPattern({
  name: 'My Trading Strategy',
  // ... pattern-specific config
  guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
  dryRun: false, // Set to true to test without executing
});

// 2. Execute pattern
const result = await pattern.execute();

// 3. Check results
if (result.success) {
  console.log(`Executed ${result.transactions.length} transactions`);
  console.log(`Duration: ${result.metrics.totalDuration}ms`);
} else {
  console.error('Pattern failed:', result.error);
}
```

## Pattern Categories

### AI Trading Agents

Automated trading strategies for AI agents and bots.

#### Grid Trading Pattern

Profit from market volatility by placing buy and sell orders at predefined price levels.

**When to use:**
- Markets with predictable volatility
- Range-bound trading
- Market making strategies

**Example:**

```typescript
import { GridTradingPattern, Guard } from '@fabriquant/sdk';

const pattern = new GridTradingPattern({
  name: 'SOL-USDC Grid',
  pair: {
    base: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
    quote: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
  },
  lowerBound: 90,      // Buy below $90
  upperBound: 110,     // Sell above $110
  gridLevels: 10,      // 10 price levels
  amountPerGrid: 1,    // 1 SOL per level
  currentPrice: {
    token: 'SOL',
    price: 100,
    quoteCurrency: 'USDC',
    timestamp: Date.now(),
  },
  guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
});

const result = await pattern.execute();
```

**Configuration:**

```typescript
interface GridTradingConfig {
  name: string;
  pair: TradingPair;
  lowerBound: number;        // Minimum price
  upperBound: number;        // Maximum price
  gridLevels: number;        // Number of grid levels
  amountPerGrid: number;     // Amount per level
  currentPrice: Price;       // Current market price
  guard?: Guard;             // Security validation
  dryRun?: boolean;          // Test mode
}
```

#### Dollar Cost Averaging (DCA)

Reduce volatility impact by purchasing fixed amounts at regular intervals.

**When to use:**
- Long-term accumulation strategies
- Automated recurring buys
- Reducing timing risk

**Example:**

```typescript
import { DCAStrategy, Guard } from '@fabriquant/sdk';

const pattern = new DCAStrategy({
  name: 'Weekly SOL Purchase',
  buyToken: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
  payToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
  amountPerInterval: 100,           // $100 per purchase
  intervalDuration: 7 * 24 * 60 * 60 * 1000, // Weekly
  totalIntervals: 52,               // 1 year
  autoExecute: true,                // Run automatically
  currentPrice: {
    token: 'SOL',
    price: 100,
    quoteCurrency: 'USDC',
    timestamp: Date.now(),
  },
  guard: new Guard({ mode: 'block', maxSlippage: 0.03 }),
});

// Start automated execution
await pattern.execute();

// Control execution
pattern.pause();   // Pause strategy
pattern.resume();  // Resume strategy
pattern.stop();    // Stop completely
```

**Configuration:**

```typescript
interface DCAConfig {
  name: string;
  buyToken: Token;
  payToken: Token;
  amountPerInterval: number;    // Amount per purchase
  intervalDuration: number;     // Time between purchases (ms)
  totalIntervals: number;       // Total number of purchases
  autoExecute?: boolean;        // Auto-schedule intervals
  currentPrice: Price;
  guard?: Guard;
  dryRun?: boolean;
}
```

#### Arbitrage Pattern

Capture price differences across multiple DEXs with parallel execution.

**When to use:**
- Price discrepancies between DEXs
- High-frequency trading opportunities
- MEV extraction

**Example:**

```typescript
import { ArbitragePattern, Guard } from '@fabriquant/sdk';

const pattern = new ArbitragePattern({
  name: 'Multi-DEX Arbitrage',
  pairs: [
    {
      base: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
      quote: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
    },
  ],
  dexes: [
    { name: 'Orca', programId: 'Orca...', feeTier: 0.003 },
    { name: 'Raydium', programId: 'Rayd...', feeTier: 0.0025 },
    { name: 'Jupiter', programId: 'Jupi...', feeTier: 0.002 },
  ],
  minProfitPercent: 0.5,        // 0.5% minimum profit
  maxTradeSize: 10000,          // $10k max per trade
  scanInterval: 5000,           // Scan every 5 seconds
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

const result = await pattern.execute();
console.log(`Found ${result.metadata.opportunitiesFound} opportunities`);
```

**Configuration:**

```typescript
interface ArbitrageConfig {
  name: string;
  pairs: TradingPair[];
  dexes: DEX[];
  minProfitPercent: number;     // Minimum profit threshold
  maxTradeSize: number;         // Maximum trade amount
  scanInterval?: number;        // Scan frequency (ms)
  guard?: Guard;
  dryRun?: boolean;
}
```

### DAO Treasury Management

Automated portfolio management for DAO treasuries.

#### Treasury Rebalancing

Maintain target asset allocations automatically by rebalancing when deviations exceed threshold.

**When to use:**
- Multi-asset treasury management
- Maintaining risk profiles
- Automated portfolio rebalancing

**Example:**

```typescript
import { TreasuryRebalancing, Guard } from '@fabriquant/sdk';

const pattern = new TreasuryRebalancing({
  name: 'DAO Treasury Rebalance',
  totalValue: 1000000,  // $1M treasury
  allocations: [
    {
      token: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
      targetPercent: 40,
      currentValue: 350000,  // Currently at $350k (35%)
    },
    {
      token: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
      targetPercent: 40,
      currentValue: 450000,  // Currently at $450k (45%)
    },
    {
      token: { mint: 'mSo...', symbol: 'mSOL', decimals: 9 },
      targetPercent: 20,
      currentValue: 200000,  // Currently at $200k (20%)
    },
  ],
  threshold: 5,                  // Rebalance if >5% deviation
  maxSlippage: 0.02,
  baseCurrency: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
  guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
});

// Check if rebalancing is needed
if (pattern.needsRebalancing()) {
  const result = await pattern.execute();
  console.log(`Executed ${result.metadata.actionsExecuted} rebalancing trades`);
}
```

**Configuration:**

```typescript
interface RebalancingConfig {
  name: string;
  totalValue: number;           // Total treasury value (USD)
  allocations: AssetAllocation[];
  threshold: number;            // Deviation threshold (%)
  minTradeSize?: number;        // Minimum trade size (USD)
  maxSlippage: number;
  baseCurrency: Token;
  guard?: Guard;
  dryRun?: boolean;
}

interface AssetAllocation {
  token: Token;
  targetPercent: number;        // Target allocation (0-100)
  currentValue: number;         // Current value (USD)
}
```

#### Yield Farming Pattern

Optimize yields across multiple protocols with automated allocation strategies.

**When to use:**
- Maximizing treasury returns
- Multi-protocol yield optimization
- Automated yield farming

**Example:**

```typescript
import { YieldFarmingPattern, Guard } from '@fabriquant/sdk';

const pattern = new YieldFarmingPattern({
  name: 'Treasury Yield Optimization',
  farmAmount: 500000,  // $500k to farm
  farmToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
  protocols: [
    {
      name: 'Solend',
      programId: 'SoLE...',
      apy: 8.5,
      token: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
    },
    {
      name: 'Marinade',
      programId: 'Mari...',
      apy: 6.8,
      token: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
    },
    {
      name: 'Orca',
      programId: 'Orca...',
      apy: 12.3,
      token: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
    },
  ],
  strategy: 'diversified',       // 'highest-apy' | 'diversified' | 'conservative'
  autoCompound: true,
  compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

const result = await pattern.execute();
const summary = pattern.getAllocationSummary();
console.log('Allocations:', summary);
```

**Strategies:**

- **highest-apy**: Allocate 100% to highest yield protocol
- **diversified**: Split across top 3 protocols (50%, 30%, 20%)
- **conservative**: Equal weight across all protocols

**Configuration:**

```typescript
interface YieldFarmingConfig {
  name: string;
  farmAmount: number;
  farmToken: Token;
  protocols: YieldProtocol[];
  strategy: 'highest-apy' | 'diversified' | 'conservative';
  autoCompound?: boolean;
  compoundFrequency?: number;   // Compound interval (ms)
  guard?: Guard;
  dryRun?: boolean;
}

interface YieldProtocol {
  name: string;
  programId: string;
  apy: number;                  // Current APY (%)
  token: Token;
  minDeposit?: number;
  maxDeposit?: number;
  lockPeriod?: number;          // Lock duration (seconds)
}
```

### DeFi Protocols

Low-level DeFi operations with intelligent optimization.

#### Swap Pattern

Multi-route swap optimization with price impact minimization and intelligent order splitting.

**When to use:**
- Large swaps that impact price
- Multi-DEX routing
- Optimized trade execution

**Example:**

```typescript
import { SwapPattern, Guard } from '@fabriquant/sdk';

const pattern = new SwapPattern({
  name: 'Optimized SOL Swap',
  fromToken: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
  toToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
  amount: 100,
  currentPrice: {
    token: 'SOL',
    price: 100,
    quoteCurrency: 'USDC',
    timestamp: Date.now(),
  },
  routes: [
    {
      dex: 'Orca',
      programId: 'Orca...',
      price: 100.5,
      liquidity: 500000,
      priceImpact: 0.15,
      fee: 0.003,
    },
    {
      dex: 'Raydium',
      programId: 'Rayd...',
      price: 100.2,
      liquidity: 300000,
      priceImpact: 0.25,
      fee: 0.0025,
    },
  ],
  maxPriceImpact: 0.5,
  enableSplitOrders: true,
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

const result = await pattern.execute();
const summary = pattern.getSummary();
console.log('Total price impact:', summary.totalPriceImpact);
console.log('Average price:', summary.averagePrice);
```

**Configuration:**

```typescript
interface SwapConfig {
  name: string;
  fromToken: Token;
  toToken: Token;
  amount: number;
  currentPrice: Price;
  routes: SwapRoute[];
  maxPriceImpact: number;       // Max allowed price impact (%)
  enableSplitOrders?: boolean;  // Split across routes
  minRouteAllocation?: number;  // Min allocation per route (%)
  guard?: Guard;
  dryRun?: boolean;
}

interface SwapRoute {
  dex: string;
  programId: string;
  price: number;
  liquidity: number;
  priceImpact: number;          // Estimated impact (%)
  fee: number;                  // Fee percentage
}
```

#### Liquidity Pattern

Automated liquidity provision with position management and impermanent loss monitoring.

**When to use:**
- Adding/removing liquidity
- LP position management
- Impermanent loss tracking

**Example:**

```typescript
import { LiquidityPattern, Guard } from '@fabriquant/sdk';

// Add liquidity
const addPattern = new LiquidityPattern({
  name: 'Add SOL-USDC Liquidity',
  action: 'add',
  pool: {
    name: 'Orca SOL-USDC',
    programId: 'Orca...',
    tokenA: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
    tokenB: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
    apy: 12.5,
    feeTier: 0.003,
    totalLiquidity: 5000000,
    priceRatio: 100,
  },
  amountA: 10,    // 10 SOL
  amountB: 1000,  // 1000 USDC
  prices: {
    tokenA: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
    tokenB: { token: 'USDC', price: 1, quoteCurrency: 'USD', timestamp: Date.now() },
  },
  monitorImpermanentLoss: true,
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

const result = await addPattern.execute();

// Monitor position
const position = addPattern.getPositionSummary();
console.log('Impermanent loss:', position?.impermanentLoss);

// Remove liquidity
const removePattern = new LiquidityPattern({
  name: 'Remove Liquidity',
  action: 'remove',
  pool: /* same pool */,
  removePercentage: 50,  // Remove 50%
  prices: { /* current prices */ },
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

await removePattern.execute();
```

**Configuration:**

```typescript
interface LiquidityConfig {
  name: string;
  action: 'add' | 'remove' | 'rebalance';
  pool: LiquidityPool;
  amountA?: number;             // For 'add'
  amountB?: number;             // For 'add'
  removePercentage?: number;    // For 'remove' (0-100)
  prices: {
    tokenA: Price;
    tokenB: Price;
  };
  monitorImpermanentLoss?: boolean;
  rebalanceThreshold?: number;  // Auto-rebalance at IL% threshold
  guard?: Guard;
  dryRun?: boolean;
}

interface LiquidityPool {
  name: string;
  programId: string;
  tokenA: Token;
  tokenB: Token;
  apy: number;
  feeTier: number;
  totalLiquidity: number;
  priceRatio: number;
}
```

## Base Pattern API

All patterns extend the `ExecutionPattern` base class:

```typescript
abstract class ExecutionPattern {
  // Execute the pattern
  abstract execute(): Promise<PatternResult>;

  // Validate configuration (override in subclass)
  protected abstract validate(): boolean;

  // Execute with automatic retry on failure
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries?: number
  ): Promise<T>;
}
```

### Pattern Result

```typescript
interface PatternResult {
  success: boolean;
  transactions: Transaction[];
  metrics: PatternMetrics;
  error?: Error;
  metadata?: Record<string, unknown>;
}

interface PatternMetrics {
  executionTime: number;        // Total duration (ms)
  gasUsed?: number;             // Total gas consumed
  successRate: number;          // Success rate (0-1)
  retryCount: number;           // Number of retries
  transactionCount: number;     // Total transactions
}
```

## Pattern Registry

Register and retrieve custom patterns:

```typescript
import { PatternRegistry, ExecutionPattern } from '@fabriquant/sdk';

// Register custom pattern
class MyCustomPattern extends ExecutionPattern {
  async execute() {
    // Implementation
  }

  protected validate() {
    // Validation
  }
}

PatternRegistry.register('my-custom-pattern', MyCustomPattern);

// Retrieve pattern
const PatternClass = PatternRegistry.get('my-custom-pattern');
if (PatternClass) {
  const pattern = new PatternClass(config);
  await pattern.execute();
}
```

## Best Practices

### 1. Always Use Guard

```typescript
const guard = new Guard({
  mode: 'block',
  maxSlippage: 0.02,
  riskTolerance: 'moderate',
});

const pattern = new GridTradingPattern({
  // ... config
  guard,  // ✅ Always include Guard
});
```

### 2. Test with Dry Run

```typescript
// Test without executing
const pattern = new SwapPattern({
  // ... config
  dryRun: true,  // ✅ Test first
});

const result = await pattern.execute();
if (result.success) {
  // Now run for real
  pattern.config.dryRun = false;
  await pattern.execute();
}
```

### 3. Monitor Metrics

```typescript
const result = await pattern.execute();

console.log('Performance:', {
  duration: result.metrics.executionTime,
  gasUsed: result.metrics.gasUsed,
  successRate: result.metrics.successRate,
  retries: result.metrics.retryCount,
});
```

### 4. Handle Errors

```typescript
const result = await pattern.execute();

if (!result.success) {
  console.error('Pattern failed:', result.error);

  // Analyze failure
  if (result.error?.message.includes('slippage')) {
    // Increase slippage tolerance
  }
}
```

### 5. Use Pattern-Specific Methods

```typescript
// Grid Trading
const gridPattern = new GridTradingPattern(config);
const levels = gridPattern.getGridLevels();  // Get all grid levels

// Treasury Rebalancing
const rebalancePattern = new TreasuryRebalancing(config);
if (rebalancePattern.needsRebalancing()) {
  await rebalancePattern.execute();
}

// Swap
const swapPattern = new SwapPattern(config);
const summary = swapPattern.getSummary();  // Get execution summary
```

### 6. Keep Configurations Immutable

```typescript
// ❌ Don't modify config after creation
pattern.config.amount = 200;

// ✅ Create new pattern instance
const newPattern = new SwapPattern({
  ...config,
  amount: 200,
});
```

### 7. Combine with Privacy

```typescript
import { FabricCore } from '@fabriquant/sdk';

const pattern = new GridTradingPattern(config);
const result = await pattern.execute();

// Add privacy to transactions
for (const tx of result.transactions) {
  const optimized = FabricCore.optimize(tx, {
    enablePrivacy: true,
    privacyProvider: 'arbor',
  });
}
```

## Additional Resources

- [Main README](../README.md)
- [API Documentation](./API.md)
- [Examples](../examples/patterns/)
- [Business Plan](../BUSINESS_PLAN.md)

## Support

For questions or issues:
- GitHub Issues: [fabriquant/issues](https://github.com/your-org/fabriquant/issues)
- Documentation: [docs.fabriquant.dev](https://docs.fabriquant.dev)
