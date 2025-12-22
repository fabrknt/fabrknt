/**
 * Core types for the Fabricant SDK
 */

export interface FabricantConfig {
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcUrl?: string;
}

/**
 * Guard Configuration (Fabric Guard)
 */
export interface GuardConfig {
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

/**
 * Loom Configuration (Flow Module)
 */
export interface LoomConfig {
  type: string;
  input?: string;
  output?: string;
  amount?: number;
  parallelPriority?: boolean;
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
