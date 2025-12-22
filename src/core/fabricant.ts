/**
 * Core Fabricant class for executing protected transactions with precision
 */

import type { FabricantConfig, Transaction } from '../types';
import type { Guard } from '../guardian';

export class Fabricant {
  private config: FabricantConfig;

  constructor(config: FabricantConfig = {}) {
    this.config = {
      network: config.network || 'mainnet-beta',
      rpcUrl: config.rpcUrl,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public static async execute(
    tx: Transaction,
    options: { with?: Guard } = {}
  ): Promise<Transaction> {
    // Validate with guard if provided
    if (options.with) {
      const isValid = options.with.validate();
      if (!isValid) {
        return { ...tx, status: 'failed' };
      }
    }

    // Placeholder execution logic
    return { ...tx, status: 'executed' };
  }

  public getConfig(): FabricantConfig {
    return this.config;
  }
}
