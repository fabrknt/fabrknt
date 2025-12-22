/**
 * Guard Validator - Transaction Validation Logic (Fabric Guard)
 */

import type {
  Transaction,
  ValidationResult,
  GuardConfig,
  SecurityWarning,
} from '../types';
import { Severity, PatternId } from '../types';
import { analyzeTransaction } from './detector';

/**
 * Validates a transaction against Guard rules
 */
export function validateTransaction(
  transaction: Transaction,
  config: GuardConfig
): ValidationResult {
  const warnings: SecurityWarning[] = [];

  // Emergency stop check
  if (config.emergencyStop) {
    return {
      isValid: false,
      warnings: [
        {
          patternId: PatternId.MintKill, // Use generic pattern for emergency
          severity: Severity.Critical,
          message: '🛑 EMERGENCY STOP: All operations are halted',
          timestamp: Date.now(),
        },
      ],
      blockedBy: [PatternId.MintKill],
    };
  }

  // Pattern detection
  if (config.enablePatternDetection !== false) {
    const detectedWarnings = analyzeTransaction(transaction);
    warnings.push(...detectedWarnings);
  }

  // Custom rules validation
  if (config.customRules && config.customRules.length > 0) {
    for (const rule of config.customRules) {
      if (rule.enabled) {
        try {
          const ruleResult = rule.validate(transaction);
          const isValid =
            ruleResult instanceof Promise ? false : ruleResult; // For now, sync only

          if (!isValid) {
            warnings.push({
              patternId: PatternId.SignerMismatch, // Generic pattern for custom rules
              severity: Severity.Warning,
              message: `Custom rule violation: ${rule.name}`,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          // Skip invalid rules
        }
      }
    }
  }

  // Determine if transaction should be blocked
  const blockedBy = determineBlocking(warnings, config);
  const isValid = blockedBy.length === 0;

  return {
    isValid,
    warnings,
    blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
  };
}

/**
 * Determines which patterns should block the transaction
 */
function determineBlocking(
  warnings: SecurityWarning[],
  config: GuardConfig
): PatternId[] {
  const mode = config.mode || 'block';
  const riskTolerance = config.riskTolerance || 'moderate';

  // In warn mode, never block
  if (mode === 'warn') {
    return [];
  }

  const blockedPatterns: PatternId[] = [];

  for (const warning of warnings) {
    const shouldBlock = shouldBlockPattern(
      warning.patternId,
      warning.severity,
      riskTolerance
    );

    if (shouldBlock && !blockedPatterns.includes(warning.patternId)) {
      blockedPatterns.push(warning.patternId);
    }
  }

  return blockedPatterns;
}

/**
 * Determines if a pattern should block based on severity and risk tolerance
 */
function shouldBlockPattern(
  pattern: PatternId,
  severity: Severity,
  riskTolerance: 'strict' | 'moderate' | 'permissive'
): boolean {
  // Critical patterns always block in strict mode
  if (severity === Severity.Critical && riskTolerance === 'strict') {
    return true;
  }

  // Moderate blocks critical patterns only
  if (severity === Severity.Critical && riskTolerance === 'moderate') {
    return true;
  }

  // Permissive only blocks mint/freeze kills
  if (
    riskTolerance === 'permissive' &&
    (pattern === PatternId.MintKill || pattern === PatternId.FreezeKill)
  ) {
    return true;
  }

  return false;
}
