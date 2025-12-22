/**
 * Core types for the Aegis Flow SDK
 */

export interface AegisFlowConfig {
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcUrl?: string;
}

/**
 * Guardian Configuration
 */
export interface GuardianConfig {
  // Slippage protection
  maxSlippage?: number;

  // Emergency stop - halts all operations if anomalies detected
  emergencyStop?: boolean;

  // Security pattern detection
  enablePatternDetection?: boolean;

  // Risk tolerance level
  riskTolerance?: 'strict' | 'moderate' | 'permissive';

  // Operation mode
  mode?: 'block' | 'warn';

  // Custom validation rules
  customRules?: ValidationRule[];
}

/**
 * Security Pattern IDs
 */
export enum PatternId {
  MintKill = 'P-101',
  FreezeKill = 'P-102',
  SignerMismatch = 'P-103',
  DangerousClose = 'P-104',
}

/**
 * Warning Severity Levels
 */
export enum Severity {
  Critical = 'critical',
  Warning = 'warning',
  Alert = 'alert',
}

/**
 * Security Warning
 */
export interface SecurityWarning {
  patternId: PatternId;
  severity: Severity;
  message: string;
  affectedAccount?: string;
  timestamp: number;
}

/**
 * Validation Rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  enabled: boolean;
  validate: (transaction: Transaction) => boolean | Promise<boolean>;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: SecurityWarning[];
  blockedBy?: PatternId[];
}

export interface FlowEngineConfig {
  action: 'SWAP' | 'STAKE' | 'LEND' | 'YIELD';
  pair?: [string, string];
  priority?: 'Low' | 'Medium' | 'High' | 'Ultra';
}

/**
 * Transaction Instruction
 */
export interface TransactionInstruction {
  programId: string;
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: string;
}

/**
 * Transaction
 */
export interface Transaction {
  id: string;
  status: 'pending' | 'executed' | 'failed';
  instructions?: TransactionInstruction[];
  signers?: string[];
}
