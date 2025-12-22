import { describe, it, expect, beforeEach } from 'vitest';
import { Guardian, PatternId, Severity } from '../src/guardian';
import type { Transaction } from '../src/types';

describe('Guardian', () => {
  let guardian: Guardian;

  beforeEach(() => {
    guardian = new Guardian();
  });

  describe('Configuration', () => {
    it('should create guardian with default config', () => {
      expect(guardian).toBeDefined();
      const config = guardian.getConfig();
      expect(config.enablePatternDetection).toBe(true);
      expect(config.riskTolerance).toBe('moderate');
      expect(config.mode).toBe('block');
      expect(config.emergencyStop).toBe(false);
    });

    it('should create guardian with custom config', () => {
      const customGuardian = new Guardian({
        maxSlippage: 0.5,
        emergencyStop: true,
        riskTolerance: 'strict',
        mode: 'warn',
      });

      const config = customGuardian.getConfig();
      expect(config.maxSlippage).toBe(0.5);
      expect(config.emergencyStop).toBe(true);
      expect(config.riskTolerance).toBe('strict');
      expect(config.mode).toBe('warn');
    });

    it('should update configuration', () => {
      guardian.updateConfig({ maxSlippage: 1.0 });
      expect(guardian.getConfig().maxSlippage).toBe(1.0);
    });
  });

  describe('Emergency Stop', () => {
    it('should block all transactions when emergency stop is active', () => {
      guardian.activateEmergencyStop();

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = guardian.validateTransaction(tx);
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('EMERGENCY STOP');
    });

    it('should allow transactions when emergency stop is deactivated', () => {
      guardian.activateEmergencyStop();
      guardian.deactivateEmergencyStop();

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = guardian.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });

    it('should return false from legacy validate when emergency stop is active', () => {
      guardian.activateEmergencyStop();
      expect(guardian.validate()).toBe(false);
    });
  });

  describe('Slippage Protection', () => {
    it('should accept slippage within limits', () => {
      const slippageGuardian = new Guardian({ maxSlippage: 1.0 });
      expect(slippageGuardian.isSlippageAcceptable(0.5)).toBe(true);
      expect(slippageGuardian.isSlippageAcceptable(1.0)).toBe(true);
    });

    it('should reject slippage exceeding limits', () => {
      const slippageGuardian = new Guardian({ maxSlippage: 1.0 });
      expect(slippageGuardian.isSlippageAcceptable(1.5)).toBe(false);
    });

    it('should accept any slippage when no limit is set', () => {
      expect(guardian.isSlippageAcceptable(100)).toBe(true);
    });
  });

  describe('Transaction Validation', () => {
    it('should validate empty transaction', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = guardian.validateTransaction(tx);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate transaction with no dangerous patterns', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'SomeOtherProgram',
            keys: [],
            data: Buffer.from([0]).toString('base64'),
          },
        ],
      };

      const result = guardian.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });

    it('should work in warn mode', () => {
      const warnGuardian = new Guardian({ mode: 'warn' });

      // Even with dangerous patterns, warn mode should not block
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [],
      };

      const result = warnGuardian.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Warning History', () => {
    it('should track warning history', () => {
      expect(guardian.getWarningHistory()).toHaveLength(0);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      guardian.validateTransaction(tx);
      // History should be empty for clean transaction
      expect(guardian.getWarningHistory()).toHaveLength(0);
    });

    it('should clear warning history', () => {
      guardian.clearWarningHistory();
      expect(guardian.getWarningHistory()).toHaveLength(0);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy validate() without transaction', () => {
      expect(guardian.validate()).toBe(true);
    });

    it('should support legacy validate() with transaction', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      expect(guardian.validate(tx)).toBe(true);
    });
  });

  describe('Risk Tolerance Levels', () => {
    it('should apply strict risk tolerance', () => {
      const strictGuardian = new Guardian({ riskTolerance: 'strict' });
      expect(strictGuardian.getConfig().riskTolerance).toBe('strict');
    });

    it('should apply moderate risk tolerance', () => {
      const moderateGuardian = new Guardian({ riskTolerance: 'moderate' });
      expect(moderateGuardian.getConfig().riskTolerance).toBe('moderate');
    });

    it('should apply permissive risk tolerance', () => {
      const permissiveGuardian = new Guardian({ riskTolerance: 'permissive' });
      expect(permissiveGuardian.getConfig().riskTolerance).toBe('permissive');
    });
  });
});
