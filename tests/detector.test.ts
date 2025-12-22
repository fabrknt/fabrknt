import { describe, it, expect } from 'vitest';
import { analyzeTransaction } from '../src/guardian/detector';
import { PatternId, Severity } from '../src/types';
import type { Transaction } from '../src/types';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

describe('Transaction Detector', () => {
  describe('Pattern Detection', () => {
    it('should return no warnings for empty transaction', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings).toHaveLength(0);
    });

    it('should return no warnings for non-token instructions', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'SomeOtherProgramId',
            keys: [],
            data: Buffer.from([0, 1, 2]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('P-101: Mint Kill Detection', () => {
    it('should detect mint authority being set to None', () => {
      // SetAuthority instruction: [6, 0 (MintTokens authority type), 0 (COption::None)]
      const setAuthorityData = Buffer.from([6, 0, 0]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'MintPubkey',
                isSigner: false,
                isWritable: true,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const mintKillWarning = warnings.find(
        (w) => w.patternId === PatternId.MintKill
      );
      expect(mintKillWarning).toBeDefined();
      expect(mintKillWarning?.severity).toBe(Severity.Critical);
      expect(mintKillWarning?.message).toContain('mint authority');
    });
  });

  describe('P-102: Freeze Kill Detection', () => {
    it('should detect freeze authority being set to None', () => {
      // SetAuthority instruction: [6, 1 (FreezeAccount authority type), 0 (COption::None)]
      const setAuthorityData = Buffer.from([6, 1, 0]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'AccountPubkey',
                isSigner: false,
                isWritable: true,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const freezeKillWarning = warnings.find(
        (w) => w.patternId === PatternId.FreezeKill
      );
      expect(freezeKillWarning).toBeDefined();
      expect(freezeKillWarning?.severity).toBe(Severity.Critical);
      expect(freezeKillWarning?.message).toContain('freeze authority');
    });
  });

  describe('P-103: Signer Mismatch Detection', () => {
    it('should detect authority transfer to unsigned wallet', () => {
      // SetAuthority instruction: [6, 0 (authority type), 1 (COption::Some), ...new authority pubkey]
      const setAuthorityData = Buffer.from([6, 0, 1]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'OldAuthorityPubkey',
                isSigner: true,
                isWritable: true,
              },
              {
                pubkey: 'NewAuthorityPubkey',
                isSigner: false,
                isWritable: false,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
        signers: ['OldAuthorityPubkey'],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const signerMismatchWarning = warnings.find(
        (w) => w.patternId === PatternId.SignerMismatch
      );
      expect(signerMismatchWarning).toBeDefined();
      expect(signerMismatchWarning?.severity).toBe(Severity.Warning);
      expect(signerMismatchWarning?.message).toContain('not a current signer');
    });

    it('should not warn if new authority is a signer', () => {
      const setAuthorityData = Buffer.from([6, 0, 1]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'OldAuthorityPubkey',
                isSigner: true,
                isWritable: true,
              },
              {
                pubkey: 'NewAuthorityPubkey',
                isSigner: true,
                isWritable: false,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
        signers: ['OldAuthorityPubkey', 'NewAuthorityPubkey'],
      };

      const warnings = analyzeTransaction(tx);

      const signerMismatchWarning = warnings.find(
        (w) => w.patternId === PatternId.SignerMismatch
      );
      expect(signerMismatchWarning).toBeUndefined();
    });
  });

  describe('P-104: Dangerous Close Detection', () => {
    it('should detect account closure', () => {
      // CloseAccount instruction: [9]
      const closeAccountData = Buffer.from([9]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'AccountToClose',
                isSigner: false,
                isWritable: true,
              },
              {
                pubkey: 'Destination',
                isSigner: false,
                isWritable: true,
              },
              {
                pubkey: 'Authority',
                isSigner: true,
                isWritable: false,
              },
            ],
            data: closeAccountData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const closeWarning = warnings.find(
        (w) => w.patternId === PatternId.DangerousClose
      );
      expect(closeWarning).toBeDefined();
      expect(closeWarning?.severity).toBe(Severity.Alert);
      expect(closeWarning?.message).toContain('Closing account');
    });
  });

  describe('Multiple Pattern Detection', () => {
    it('should detect multiple patterns in one transaction', () => {
      const mintKillData = Buffer.from([6, 0, 0]);
      const closeAccountData = Buffer.from([9]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [{ pubkey: 'Mint', isSigner: false, isWritable: true }],
            data: mintKillData.toString('base64'),
          },
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              { pubkey: 'Account', isSigner: false, isWritable: true },
              { pubkey: 'Dest', isSigner: false, isWritable: true },
              { pubkey: 'Auth', isSigner: true, isWritable: false },
            ],
            data: closeAccountData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThanOrEqual(2);

      const patternIds = warnings.map((w) => w.patternId);
      expect(patternIds).toContain(PatternId.MintKill);
      expect(patternIds).toContain(PatternId.DangerousClose);
    });
  });
});
