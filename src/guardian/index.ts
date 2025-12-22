/**
 * Aegis Guardian - The Safety Layer
 * Prevents unauthorized drain, excessive slippage, or malicious CPI calls in real-time.
 */

import type {
  GuardianConfig,
  Transaction,
  ValidationResult,
  SecurityWarning,
} from '../types';
import { validateTransaction } from './validator';

export class Guardian {
  private config: GuardianConfig;
  private warningHistory: SecurityWarning[] = [];

  constructor(config: GuardianConfig = {}) {
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
   * Validates a transaction against Guardian security rules
   */
  public validateTransaction(transaction: Transaction): ValidationResult {
    const result = validateTransaction(transaction, this.config);

    // Store warnings in history
    this.warningHistory.push(...result.warnings);

    return result;
  }

  /**
   * Legacy validate method for backward compatibility
   */
  public validate(transaction?: Transaction): boolean {
    if (!transaction) {
      return !this.config.emergencyStop;
    }

    const result = this.validateTransaction(transaction);
    return result.isValid;
  }

  /**
   * Gets the current Guardian configuration
   */
  public getConfig(): GuardianConfig {
    return { ...this.config };
  }

  /**
   * Updates Guardian configuration
   */
  public updateConfig(updates: Partial<GuardianConfig>): void {
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

export type { GuardianConfig };
export { PatternId, Severity } from '../types';
export type { SecurityWarning, ValidationResult } from '../types';
