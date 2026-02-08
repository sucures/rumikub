/**
 * Wallet service tests (Step 34).
 * Mocks db and config to test WalletError paths and return shapes.
 */
import { WalletError } from '../../src/errors/WalletError.js';
import {
  spendTokens,
  transferTokens,
  getWalletBalance,
  getWalletTransactions,
} from '../../src/services/walletService.js';

let mockUsersExist: unknown[] = [];
jest.mock('../../src/db/index.js', () => {
  const mockTx = {
    insert: () => ({ values: () => ({ onConflictDoNothing: () => Promise.resolve() }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ balance: 100 }]) }) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };
  return {
    db: {
      insert: () => ({ values: () => ({ onConflictDoNothing: () => Promise.resolve() }) }),
      select: () => ({
        from: () => ({
          where: () => ({ limit: () => Promise.resolve(mockUsersExist) }),
        }),
      }),
      transaction: (cb: (tx: unknown) => Promise<unknown>) => cb(mockTx),
    },
  };
});

jest.mock('../../src/config/wallet.js', () => ({ walletMaxAmount: 1000 }));

describe('walletService', () => {
  beforeEach(() => {
    mockUsersExist = [];
  });

  describe('spendTokens', () => {
    it('throws WalletError.invalidAmount when amount <= 0', async () => {
      await expect(spendTokens('u1', 0, {})).rejects.toThrow(WalletError);
      await expect(spendTokens('u1', 0, {})).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than 0',
      });
      await expect(spendTokens('u1', -1, {})).rejects.toThrow(WalletError);
    });

    it('throws WalletError.invalidAmount when amount exceeds walletMaxAmount', async () => {
      await expect(spendTokens('u1', 1001, {})).rejects.toThrow(WalletError);
      await expect(spendTokens('u1', 1001, {})).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
    });

    it('returns { balance, transactionId } on success', async () => {
      const result = await spendTokens('u1', 10, { ref: 'test' });
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('transactionId');
      expect(typeof result.balance).toBe('number');
      expect(typeof result.transactionId).toBe('string');
      expect(result.transactionId).toMatch(/^wt_/);
    });
  });

  describe('transferTokens', () => {
    it('throws WalletError.invalidAmount when amount <= 0', async () => {
      await expect(transferTokens('u1', 'u2', 0, {})).rejects.toThrow(WalletError);
      await expect(transferTokens('u1', 'u2', 0, {})).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
    });

    it('throws WalletError.invalidAmount when amount exceeds walletMaxAmount', async () => {
      await expect(transferTokens('u1', 'u2', 1001, {})).rejects.toThrow(WalletError);
      await expect(transferTokens('u1', 'u2', 1001, {})).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
    });

    it('throws WalletError.invalidTransfer when fromUserId === toUserId', async () => {
      await expect(transferTokens('u1', 'u1', 10, {})).rejects.toThrow(WalletError);
      await expect(transferTokens('u1', 'u1', 10, {})).rejects.toMatchObject({
        code: 'INVALID_TRANSFER',
        message: 'Cannot transfer to yourself',
      });
    });

    it('throws WalletError.invalidTransfer when recipient not found', async () => {
      await expect(transferTokens('u1', 'nonexistent', 10, {})).rejects.toThrow(WalletError);
      await expect(transferTokens('u1', 'nonexistent', 10, {})).rejects.toMatchObject({ code: 'INVALID_TRANSFER' });
    });

    it('returns { fromBalance, toBalance, transactionId } on success', async () => {
      mockUsersExist = [{ id: 'u2' }];
      const result = await transferTokens('u1', 'u2', 10, { note: 'test' });
      expect(result).toHaveProperty('fromBalance');
      expect(result).toHaveProperty('toBalance');
      expect(result).toHaveProperty('transactionId');
      expect(typeof result.transactionId).toBe('string');
      expect(result.transactionId).toMatch(/^wt_/);
    });
  });
});
