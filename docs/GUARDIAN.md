# Fabric Guard - Security Layer Documentation

## Overview

Fabric Guard is the quality control layer of the Fabricant SDK, designed to prevent unauthorized drain, excessive slippage, and malicious operations in Solana transactions. It provides real-time security pattern detection and configurable validation rules.

## Features

- **🔍 Security Pattern Detection** - Detects 4 critical patterns (P-101 to P-104)
- **🛡️ Pre-Execution Validation** - Validates transactions before they're signed
- **⚡ Emergency Stop** - Immediate halt of all operations when needed
- **📊 Risk Tolerance Levels** - Configurable strictness (strict/moderate/permissive)
- **📈 Slippage Protection** - Guards against excessive slippage
- **🔧 Custom Rules** - Add your own validation logic
- **📝 Warning History** - Track all security warnings

## Installation

```bash
npm install @fabricant/sdk
```

## Quick Start

```typescript
import { Guard } from '@fabricant/sdk';

// Create a Guard with default configuration
const guard = new Guard();

// Validate a transaction
const result = guard.validateTransaction(transaction);

if (!result.isValid) {
  console.log('Transaction blocked:', result.blockedBy);
  console.log('Warnings:', result.warnings);
}
```

## Configuration

### GuardConfig

```typescript
interface GuardConfig {
  // Slippage protection (percentage)
  maxSlippage?: number;

  // Emergency stop - halts all operations
  emergencyStop?: boolean;

  // Enable/disable pattern detection
  enablePatternDetection?: boolean;

  // Risk tolerance level
  riskTolerance?: 'strict' | 'moderate' | 'permissive';

  // Operation mode
  mode?: 'block' | 'warn';

  // Custom validation rules
  customRules?: ValidationRule[];
}
```

### Risk Tolerance Levels

#### Strict
- Blocks all critical and warning-level patterns
- Recommended for production environments
- Maximum security

```typescript
const guard = new Guard({ riskTolerance: 'strict' });
```

#### Moderate (Default)
- Blocks only critical patterns
- Warns on lower-severity issues
- Balanced security and flexibility

```typescript
const guard = new Guard({ riskTolerance: 'moderate' });
```

#### Permissive
- Blocks only irreversible operations (mint/freeze kills)
- Minimal intervention
- For advanced users

```typescript
const guard = new Guard({ riskTolerance: 'permissive' });
```

### Operation Modes

#### Block Mode (Default)
Prevents dangerous transactions from executing:

```typescript
const guard = new Guard({ mode: 'block' });
```

#### Warn Mode
Allows all transactions but logs warnings:

```typescript
const guard = new Guard({ mode: 'warn' });
```

## Security Patterns

Guard detects 4 critical security patterns based on `sol-ops-guard`:

### P-101: Mint Kill 🔴 CRITICAL
**Description**: Permanently disabling mint authority

**Risk**: Irreversible. No more tokens can be minted.

**Example**:
```typescript
// Detected when SetAuthority(MintTokens, None) is called
```

**Protection**: Blocked in moderate+ risk tolerance

---

### P-102: Freeze Kill 🔴 CRITICAL
**Description**: Permanently disabling freeze authority

**Risk**: Irreversible. Loss of freeze capability.

**Example**:
```typescript
// Detected when SetAuthority(FreezeAccount, None) is called
```

**Protection**: Blocked in moderate+ risk tolerance

---

### P-103: Signer Mismatch ⚠️ WARNING
**Description**: Transferring authority to unsigned wallet

**Risk**: Potential lockout if new authority is compromised.

**Example**:
```typescript
// Detected when new authority is not in transaction signers
```

**Protection**: Blocked in strict mode, warned in moderate

---

### P-104: Dangerous Close ⚡ ALERT
**Description**: Closing account without balance verification

**Risk**: Potential loss of funds if balance is not transferred.

**Example**:
```typescript
// Detected when CloseAccount instruction is used
```

**Protection**: Warned in all modes

## API Reference

### Guard Class

#### Constructor

```typescript
constructor(config?: GuardConfig)
```

Creates a new Guard instance with optional configuration.

#### Methods

##### validateTransaction()
```typescript
validateTransaction(transaction: Transaction): ValidationResult
```

Validates a transaction against all Guard rules.

**Returns**: `ValidationResult`
- `isValid`: boolean - Whether transaction passes validation
- `warnings`: Array of security warnings detected
- `blockedBy`: Array of pattern IDs that blocked the transaction

##### validate()
```typescript
validate(transaction?: Transaction): boolean
```

Legacy validation method. Returns `true` if valid, `false` otherwise.

##### getConfig()
```typescript
getConfig(): GuardConfig
```

Returns the current Guard configuration.

##### updateConfig()
```typescript
updateConfig(updates: Partial<GuardConfig>): void
```

Updates Guard configuration at runtime.

##### activateEmergencyStop()
```typescript
activateEmergencyStop(): void
```

Immediately blocks all operations.

##### deactivateEmergencyStop()
```typescript
deactivateEmergencyStop(): void
```

Resumes normal operations.

##### isSlippageAcceptable()
```typescript
isSlippageAcceptable(actualSlippage: number): boolean
```

Checks if slippage is within acceptable limits.

##### getWarningHistory()
```typescript
getWarningHistory(): SecurityWarning[]
```

Returns all warnings detected since Guard creation.

##### clearWarningHistory()
```typescript
clearWarningHistory(): void
```

Clears the warning history.

## Usage Examples

### Basic Validation

```typescript
import { Guard } from '@fabricant/sdk';

const guard = new Guard({
  maxSlippage: 1.0,
  riskTolerance: 'moderate',
});

const result = guard.validateTransaction(tx);

if (result.isValid) {
  // Safe to proceed
  await sendTransaction(tx);
} else {
  console.error('Transaction blocked:', result.blockedBy);
  result.warnings.forEach(warning => {
    console.log(warning.message);
  });
}
```

### Emergency Stop

```typescript
const guard = new Guard();

// In case of security incident
guard.activateEmergencyStop();

// All transactions will be blocked
const result = guard.validate(); // false

// Resume when safe
guard.deactivateEmergencyStop();
```

### Custom Rules

```typescript
const guard = new Guard({
  customRules: [
    {
      id: 'max-value',
      name: 'Maximum Transaction Value',
      enabled: true,
      validate: (tx) => {
        // Custom logic
        return tx.value < 1000000;
      },
    },
  ],
});
```

### Slippage Protection

```typescript
const guard = new Guard({ maxSlippage: 0.5 }); // 0.5%

// Before swap execution
if (!guard.isSlippageAcceptable(actualSlippage)) {
  throw new Error('Slippage exceeds limit');
}
```

### Monitoring Warnings

```typescript
const guard = new Guard();

// Validate multiple transactions
guard.validateTransaction(tx1);
guard.validateTransaction(tx2);
guard.validateTransaction(tx3);

// Review all warnings
const warnings = guard.getWarningHistory();
console.log(`Total warnings: ${warnings.length}`);

warnings.forEach(warning => {
  console.log(`[${warning.severity}] ${warning.message}`);
});
```

## Integration with Fabricant

```typescript
import { Fabricant, Guard } from '@fabricant/sdk';

const guard = new Guard({
  maxSlippage: 1.0,
  emergencyStop: false,
});

// Guard is automatically used by Fabricant.execute()
await Fabricant.execute(tx, { with: guard });
```

## Best Practices

1. **Always use Guard in production** - Even in permissive mode
2. **Set appropriate risk tolerance** - Balance security with flexibility
3. **Monitor warning history** - Review patterns regularly
4. **Implement emergency procedures** - Have a plan for activateEmergencyStop()
5. **Test in warn mode first** - Understand warnings before blocking
6. **Use custom rules for domain logic** - Add business-specific validations

## TypeScript Types

```typescript
import type {
  GuardConfig,
  ValidationResult,
  SecurityWarning,
  ValidationRule,
} from '@fabricant/sdk';

// Pattern IDs
import { PatternId } from '@fabricant/sdk';
// PatternId.MintKill, FreezeKill, SignerMismatch, DangerousClose

// Severity Levels
import { Severity } from '@fabricant/sdk';
// Severity.Critical, Warning, Alert
```

## Performance

- **Validation Time**: < 1ms for typical transactions
- **Memory**: ~1KB base + warnings history
- **Pattern Detection**: O(n) where n = number of instructions

## Roadmap

- [ ] Support for Token-2022 program patterns
- [ ] Integration with on-chain oracle data
- [ ] ML-based anomaly detection
- [ ] Multi-signature policy enforcement
- [ ] Time-based transaction limits
- [ ] WebSocket notifications

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

- GitHub Issues: https://github.com/psyto/fabricant/issues
- Documentation: https://github.com/psyto/fabricant
- Twitter: https://x.com/psyto
