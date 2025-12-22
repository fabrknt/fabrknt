/**
 * Guard - The Safety Layer (Fabric Guard)
 * Prevents unauthorized drain, excessive slippage, or malicious CPI calls in real-time.
 */

import type {
  GuardConfig,
  Transaction,
  ValidationResult,
  SecurityWarning,
} from '../types';
import { validateTransaction } from './validator';

export class Guard {
  private config: GuardConfig;
  private warningHistory: SecurityWarning[] = [];

  constructor(config: GuardConfig = {}) {
    // Set default configuration
    this.config = {
      enablePatternDetection: true,
      riskTolerance: 'moderate',
      mode: 'block',
      emergencyStop: false,
      ...config,
    };
  }

  /**
   * Validates a transaction against Guard security rules
   */
  public async validateTransaction(transaction: Transaction): Promise<ValidationResult> {
    const result = await validateTransaction(transaction, this.config);

    // Store warnings in history
    this.warningHistory.push(...result.warnings);

    return result;
  }

  /**
   * Legacy validate method for backward compatibility
   * Note: This is now async due to Pulsar integration
   */
  public async validate(transaction?: Transaction): Promise<boolean> {
    if (!transaction) {
      return !this.config.emergencyStop;
    }

    const result = await this.validateTransaction(transaction);
    return result.isValid;
  }

  /**
   * Gets the current Guard configuration
   */
  public getConfig(): GuardConfig {
    return { ...this.config };
  }

  /**
   * Updates Guard configuration
   */
  public updateConfig(updates: Partial<GuardConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Activates emergency stop - blocks all operations
   */
  public activateEmergencyStop(): void {
    this.config.emergencyStop = true;
  }

  /**
   * Deactivates emergency stop - resumes normal operations
   */
  public deactivateEmergencyStop(): void {
    this.config.emergencyStop = false;
  }

  /**
   * Gets warning history
   */
  public getWarningHistory(): SecurityWarning[] {
    return [...this.warningHistory];
  }

  /**
   * Clears warning history
   */
  public clearWarningHistory(): void {
    this.warningHistory = [];
  }

  /**
   * Checks if a specific slippage is acceptable
   */
  public isSlippageAcceptable(actualSlippage: number): boolean {
    if (this.config.maxSlippage === undefined) {
      return true;
    }
    return actualSlippage <= this.config.maxSlippage;
  }
}

export type { GuardConfig };
export { PatternId, Severity } from '../types';
export type { SecurityWarning, ValidationResult } from '../types';
