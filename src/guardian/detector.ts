/**
 * Guardian Detector - Security Pattern Detection
 * Port of sol-ops-guard detector logic to TypeScript
 */

import type {
  Transaction,
  TransactionInstruction,
  SecurityWarning,
} from '../types';
import { PatternId as Pattern, Severity as Sev } from '../types';

// SPL Token Program IDs
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

// Instruction discriminators for SPL Token
const SET_AUTHORITY_INSTRUCTION = 6;
const CLOSE_ACCOUNT_INSTRUCTION = 9;

/**
 * Analyzes a transaction for dangerous patterns
 */
export function analyzeTransaction(transaction: Transaction): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  if (!transaction.instructions || transaction.instructions.length === 0) {
    return warnings;
  }

  const signers = new Set(transaction.signers || []);

  for (const instruction of transaction.instructions) {
    // Check if this is a token program instruction
    if (
      instruction.programId === TOKEN_PROGRAM_ID ||
      instruction.programId === TOKEN_2022_PROGRAM_ID
    ) {
      const instructionType = getInstructionType(instruction.data);

      if (instructionType === SET_AUTHORITY_INSTRUCTION) {
        warnings.push(...analyzeSetAuthority(instruction, signers));
      } else if (instructionType === CLOSE_ACCOUNT_INSTRUCTION) {
        warnings.push(...analyzeCloseAccount(instruction));
      }
    }
  }

  return warnings;
}

/**
 * Analyzes SetAuthority instructions for dangerous patterns
 */
function analyzeSetAuthority(
  instruction: TransactionInstruction,
  signers: Set<string>
): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  try {
    // Parse instruction data
    // Note: This is a simplified version. Production code should use proper Borsh deserialization
    const data = Buffer.from(instruction.data, 'base64');
    const authorityType = data[1]; // Authority type is at index 1
    const hasNewAuthority = data[2] === 1; // COption indicator

    const accountPubkey = instruction.keys[0]?.pubkey;

    // P-101: Mint Kill - Setting mint authority to None
    if (authorityType === 0 && !hasNewAuthority) {
      warnings.push({
        patternId: Pattern.MintKill,
        severity: Sev.Critical,
        message:
          '🚨 CRITICAL: Permanently disabling mint authority. This action is irreversible!',
        affectedAccount: accountPubkey,
        timestamp: Date.now(),
      });
    }

    // P-102: Freeze Kill - Setting freeze authority to None
    if (authorityType === 1 && !hasNewAuthority) {
      warnings.push({
        patternId: Pattern.FreezeKill,
        severity: Sev.Critical,
        message:
          '🚨 CRITICAL: Permanently disabling freeze authority. You will lose freeze capability!',
        affectedAccount: accountPubkey,
        timestamp: Date.now(),
      });
    }

    // P-103: Signer Mismatch - New authority is not a current signer
    if (hasNewAuthority && instruction.keys.length > 1) {
      const newAuthority = instruction.keys[1]?.pubkey;
      if (newAuthority && !signers.has(newAuthority)) {
        warnings.push({
          patternId: Pattern.SignerMismatch,
          severity: Sev.Warning,
          message: `⚠️  WARNING: New authority (${newAuthority}) is not a current signer. Risk of lockout!`,
          affectedAccount: accountPubkey,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    // Silently skip if we can't parse the instruction
  }

  return warnings;
}

/**
 * Analyzes CloseAccount instructions for dangerous patterns
 */
function analyzeCloseAccount(
  instruction: TransactionInstruction
): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  const accountPubkey = instruction.keys[0]?.pubkey;

  // P-104: Dangerous Close - Closing account without explicit balance check
  warnings.push({
    patternId: Pattern.DangerousClose,
    severity: Sev.Alert,
    message:
      '⚡ ALERT: Closing account. Ensure balance has been transferred or is zero!',
    affectedAccount: accountPubkey,
    timestamp: Date.now(),
  });

  return warnings;
}

/**
 * Extracts instruction type from instruction data
 */
function getInstructionType(data: string): number {
  try {
    const buffer = Buffer.from(data, 'base64');
    return buffer.length > 0 ? buffer[0] : -1;
  } catch {
    return -1;
  }
}
