/**
 * Basic Guardian Usage Example
 *
 * This example demonstrates how to use the Guardian module for
 * transaction validation and security pattern detection.
 */

import {
  Guardian,
  PatternId,
  Severity,
  type Transaction,
  type ValidationResult,
} from '@aegis-flow/sdk';

// Example 1: Basic Guardian with Default Configuration
function basicGuardian() {
  console.log('=== Example 1: Basic Guardian ===\n');

  const guardian = new Guardian();

  const tx: Transaction = {
    id: 'tx-001',
    status: 'pending',
  };

  const result = guardian.validateTransaction(tx);
  console.log('Validation Result:', result.isValid);
  console.log('Warnings:', result.warnings.length);
}

// Example 2: Guardian with Slippage Protection
function slippageProtection() {
  console.log('\n=== Example 2: Slippage Protection ===\n');

  const guardian = new Guardian({
    maxSlippage: 1.0, // 1% maximum slippage
  });

  // Check if slippage is acceptable
  console.log('0.5% slippage:', guardian.isSlippageAcceptable(0.5)); // true
  console.log('1.5% slippage:', guardian.isSlippageAcceptable(1.5)); // false
}

// Example 3: Emergency Stop Mechanism
function emergencyStop() {
  console.log('\n=== Example 3: Emergency Stop ===\n');

  const guardian = new Guardian();

  // Normal operation
  console.log('Normal operation:', guardian.validate());

  // Activate emergency stop
  guardian.activateEmergencyStop();
  console.log('After emergency stop:', guardian.validate());

  // Deactivate
  guardian.deactivateEmergencyStop();
  console.log('After deactivation:', guardian.validate());
}

// Example 4: Risk Tolerance Levels
function riskTolerance() {
  console.log('\n=== Example 4: Risk Tolerance Levels ===\n');

  // Strict mode - blocks all critical patterns
  const strictGuardian = new Guardian({
    riskTolerance: 'strict',
    mode: 'block',
  });

  // Moderate mode - blocks only critical patterns
  const moderateGuardian = new Guardian({
    riskTolerance: 'moderate',
    mode: 'block',
  });

  // Permissive mode - blocks only irreversible operations
  const permissiveGuardian = new Guardian({
    riskTolerance: 'permissive',
    mode: 'block',
  });

  console.log('Strict config:', strictGuardian.getConfig().riskTolerance);
  console.log('Moderate config:', moderateGuardian.getConfig().riskTolerance);
  console.log(
    'Permissive config:',
    permissiveGuardian.getConfig().riskTolerance
  );
}

// Example 5: Warn Mode vs Block Mode
function warnVsBlock() {
  console.log('\n=== Example 5: Warn vs Block Mode ===\n');

  // Block mode - prevents dangerous transactions
  const blockGuardian = new Guardian({
    mode: 'block',
  });

  // Warn mode - allows transactions but logs warnings
  const warnGuardian = new Guardian({
    mode: 'warn',
  });

  console.log('Block mode config:', blockGuardian.getConfig().mode);
  console.log('Warn mode config:', warnGuardian.getConfig().mode);
}

// Example 6: Custom Validation Rules
function customRules() {
  console.log('\n=== Example 6: Custom Validation Rules ===\n');

  const guardian = new Guardian({
    customRules: [
      {
        id: 'max-instructions',
        name: 'Maximum Instructions Check',
        enabled: true,
        validate: (tx: Transaction) => {
          // Limit to 10 instructions per transaction
          return (tx.instructions?.length || 0) <= 10;
        },
      },
    ],
  });

  const validTx: Transaction = {
    id: 'tx-002',
    status: 'pending',
    instructions: [
      /* up to 10 instructions */
    ],
  };

  const result = guardian.validateTransaction(validTx);
  console.log('Custom rule validation:', result.isValid);
}

// Example 7: Monitoring Warning History
function warningHistory() {
  console.log('\n=== Example 7: Warning History ===\n');

  const guardian = new Guardian();

  // Validate some transactions
  guardian.validateTransaction({ id: 'tx-003', status: 'pending' });
  guardian.validateTransaction({ id: 'tx-004', status: 'pending' });

  // Get warning history
  const warnings = guardian.getWarningHistory();
  console.log('Total warnings:', warnings.length);

  // Clear history
  guardian.clearWarningHistory();
  console.log('After clear:', guardian.getWarningHistory().length);
}

// Example 8: Dynamic Configuration Updates
function dynamicConfig() {
  console.log('\n=== Example 8: Dynamic Configuration ===\n');

  const guardian = new Guardian({
    maxSlippage: 1.0,
    riskTolerance: 'moderate',
  });

  console.log('Initial max slippage:', guardian.getConfig().maxSlippage);

  // Update configuration at runtime
  guardian.updateConfig({
    maxSlippage: 2.0,
    riskTolerance: 'strict',
  });

  console.log('Updated max slippage:', guardian.getConfig().maxSlippage);
  console.log('Updated risk tolerance:', guardian.getConfig().riskTolerance);
}

// Run all examples
function runExamples() {
  basicGuardian();
  slippageProtection();
  emergencyStop();
  riskTolerance();
  warnVsBlock();
  customRules();
  warningHistory();
  dynamicConfig();
}

// Uncomment to run
// runExamples();
