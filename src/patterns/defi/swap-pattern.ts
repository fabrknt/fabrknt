/**
 * Optimized Swap Pattern
 *
 * Multi-route swap optimization with price impact minimization
 * and intelligent order splitting across DEXs.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabriquant } from '../../core/fabriquant';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  Token,
  Price,
} from '../types';

/**
 * Swap route option
 */
export interface SwapRoute {
  /** DEX name */
  dex: string;
  /** DEX program ID */
  programId: string;
  /** Price for this route */
  price: number;
  /** Liquidity available */
  liquidity: number;
  /** Estimated price impact (%) */
  priceImpact: number;
  /** Fee percentage */
  fee: number;
}

/**
 * Swap configuration
 */
export interface SwapConfig extends PatternConfig {
  /** Token to swap from */
  fromToken: Token;
  /** Token to swap to */
  toToken: Token;
  /** Amount to swap */
  amount: number;
  /** Current price */
  currentPrice: Price;
  /** Available routes */
  routes: SwapRoute[];
  /** Maximum price impact allowed (%) */
  maxPriceImpact: number;
  /** Split orders across routes */
  enableSplitOrders?: boolean;
  /** Minimum route allocation (%) */
  minRouteAllocation?: number;
}

/**
 * Optimized Swap Pattern
 *
 * Executes swaps with intelligent route selection and order splitting
 * to minimize price impact and maximize execution quality.
 *
 * @example
 * ```typescript
 * const swapPattern = new SwapPattern({
 *   name: 'SOL to USDC Swap',
 *   fromToken: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *   toToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   amount: 100,
 *   currentPrice: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
 *   routes: [
 *     {
 *       dex: 'Orca',
 *       programId: 'Orca...',
 *       price: 100.5,
 *       liquidity: 500000,
 *       priceImpact: 0.15,
 *       fee: 0.003,
 *     },
 *     {
 *       dex: 'Raydium',
 *       programId: 'Rayd...',
 *       price: 100.2,
 *       liquidity: 300000,
 *       priceImpact: 0.25,
 *       fee: 0.0025,
 *     },
 *   ],
 *   maxPriceImpact: 0.5,
 *   enableSplitOrders: true,
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
 * });
 *
 * const result = await swapPattern.execute();
 * ```
 */
export class SwapPattern extends ExecutionPattern {
  private config: SwapConfig;
  private allocations: Map<string, { route: SwapRoute; amount: number }> =
    new Map();

  constructor(config: SwapConfig) {
    super(config);
    this.config = {
      enableSplitOrders: true,
      minRouteAllocation: 10, // 10% minimum
      ...config,
    };
  }

  /**
   * Execute optimized swap
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid swap configuration');
      }

      // Calculate optimal route allocations
      this.calculateRouteAllocations();

      const transactions: Transaction[] = [];

      // Execute swaps across selected routes
      for (const [dex, allocation] of this.allocations) {
        const tx = await this.executeSwapOnRoute(
          allocation.route,
          allocation.amount
        );
        transactions.push(tx);

        if (!this.config.dryRun && this.config.guard) {
          await Fabriquant.execute(tx, { with: this.config.guard });
        }
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          routes: Object.fromEntries(
            Array.from(this.allocations.entries()).map(([dex, alloc]) => [
              dex,
              {
                amount: alloc.amount,
                percentage: (alloc.amount / this.config.amount) * 100,
                priceImpact: alloc.route.priceImpact,
              },
            ])
          ),
          totalPriceImpact: this.calculateTotalPriceImpact(),
          averagePrice: this.calculateAveragePrice(),
        },
      };
    } catch (error) {
      return {
        success: false,
        transactions: [],
        metrics: this.createMetrics([]),
        error: error as Error,
      };
    }
  }

  /**
   * Validate swap configuration
   */
  protected validate(): boolean {
    const { amount, routes, maxPriceImpact } = this.config;

    if (amount <= 0) {
      console.error('Swap amount must be positive');
      return false;
    }

    if (routes.length === 0) {
      console.error('At least one route is required');
      return false;
    }

    // Check if any route exceeds max price impact
    if (routes.every(r => r.priceImpact > maxPriceImpact)) {
      console.error('All routes exceed maximum price impact');
      return false;
    }

    return true;
  }

  /**
   * Calculate optimal route allocations
   */
  private calculateRouteAllocations(): void {
    this.allocations.clear();

    const { routes, amount, enableSplitOrders, maxPriceImpact } = this.config;

    // Filter routes by max price impact
    const validRoutes = routes
      .filter(r => r.priceImpact <= maxPriceImpact)
      .sort((a, b) => {
        // Sort by best execution (price - fees - price impact)
        const scoreA = a.price - a.price * (a.fee + a.priceImpact / 100);
        const scoreB = b.price - b.price * (b.fee + b.priceImpact / 100);
        return scoreB - scoreA;
      });

    if (validRoutes.length === 0) {
      throw new Error('No valid routes available');
    }

    if (!enableSplitOrders || validRoutes.length === 1) {
      // Use single best route
      this.allocations.set(validRoutes[0].dex, {
        route: validRoutes[0],
        amount,
      });
      return;
    }

    // Split orders across multiple routes to minimize impact
    this.splitOrdersAcrossRoutes(validRoutes, amount);
  }

  /**
   * Split orders across multiple routes
   */
  private splitOrdersAcrossRoutes(
    routes: SwapRoute[],
    totalAmount: number
  ): void {
    // Calculate allocation based on liquidity and price impact
    const scores = routes.map(route => {
      // Higher liquidity and lower price impact = higher score
      const liquidityScore = route.liquidity;
      const impactPenalty = 1 / (1 + route.priceImpact);
      return liquidityScore * impactPenalty;
    });

    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    // Allocate proportionally to scores
    routes.forEach((route, index) => {
      const percentage = scores[index] / totalScore;
      const amount = totalAmount * percentage;

      // Only include if above minimum allocation
      if (
        percentage * 100 >=
        (this.config.minRouteAllocation || 0)
      ) {
        this.allocations.set(route.dex, { route, amount });
      }
    });

    // If no allocations met minimum, use best route
    if (this.allocations.size === 0) {
      this.allocations.set(routes[0].dex, {
        route: routes[0],
        amount: totalAmount,
      });
    }
  }

  /**
   * Execute swap on a specific route
   */
  private async executeSwapOnRoute(
    route: SwapRoute,
    amount: number
  ): Promise<Transaction> {
    const tx = await Loom.weave({
      type: 'SWAP',
      input: this.config.fromToken.symbol,
      output: this.config.toToken.symbol,
      amount,
      parallelPriority: false,
    });

    return {
      ...tx,
      metadata: {
        pattern: 'swap',
        route: route.dex,
        priceImpact: route.priceImpact,
        fee: route.fee,
        expectedPrice: route.price,
      },
    };
  }

  /**
   * Calculate total price impact across all routes
   */
  private calculateTotalPriceImpact(): number {
    let totalImpact = 0;

    for (const [, allocation] of this.allocations) {
      const weight = allocation.amount / this.config.amount;
      totalImpact += allocation.route.priceImpact * weight;
    }

    return totalImpact;
  }

  /**
   * Calculate average execution price
   */
  private calculateAveragePrice(): number {
    let totalPrice = 0;

    for (const [, allocation] of this.allocations) {
      const weight = allocation.amount / this.config.amount;
      totalPrice += allocation.route.price * weight;
    }

    return totalPrice;
  }

  /**
   * Get execution summary
   */
  getSummary(): {
    routes: Array<{
      dex: string;
      amount: number;
      percentage: number;
      priceImpact: number;
    }>;
    totalPriceImpact: number;
    averagePrice: number;
  } {
    return {
      routes: Array.from(this.allocations.entries()).map(([dex, alloc]) => ({
        dex,
        amount: alloc.amount,
        percentage: (alloc.amount / this.config.amount) * 100,
        priceImpact: alloc.route.priceImpact,
      })),
      totalPriceImpact: this.calculateTotalPriceImpact(),
      averagePrice: this.calculateAveragePrice(),
    };
  }
}
