/**
 * Card simulation service tests (Step 34): validation, merchantName in metadata, transactionId.
 */
import { WalletError } from '../../src/errors/WalletError.js';
import { spendTokens } from '../../src/services/walletService.js';
import { simulateCardPayment } from '../../src/services/cardSimulationService.js';

jest.mock('../../src/services/walletService', () => ({
  spendTokens: jest.fn(),
}));

jest.mock('../../src/services/notificationTriggers', () => ({
  triggerSystemMessage: jest.fn().mockResolvedValue(undefined),
}));

const spendTokensMock = spendTokens as jest.MockedFunction<typeof spendTokens>;

describe('cardSimulationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (spendTokensMock as jest.Mock).mockResolvedValue({ balance: 80, transactionId: 'wt_sim_1' });
  });

  it('throws WalletError.invalidAmount when merchantName is empty', async () => {
    await expect(simulateCardPayment('u1', 10, '')).rejects.toThrow(WalletError);
    await expect(simulateCardPayment('u1', 10, '')).rejects.toMatchObject({
      code: 'INVALID_AMOUNT',
      message: 'merchantName is required',
    });
    await expect(simulateCardPayment('u1', 10, '   ')).rejects.toThrow(WalletError);
    expect(spendTokensMock).not.toHaveBeenCalled();
  });

  it('throws WalletError.invalidAmount when amount <= 0', async () => {
    await expect(simulateCardPayment('u1', 0, 'Shop')).rejects.toThrow(WalletError);
    await expect(simulateCardPayment('u1', -5, 'Shop')).rejects.toThrow(WalletError);
    expect(spendTokensMock).not.toHaveBeenCalled();
  });

  it('throws WalletError.invalidAmount when amount is not a finite number', async () => {
    await expect(simulateCardPayment('u1', NaN, 'Shop')).rejects.toThrow(WalletError);
    await expect(simulateCardPayment('u1', Infinity, 'Shop')).rejects.toThrow(WalletError);
    expect(spendTokensMock).not.toHaveBeenCalled();
  });

  it('calls spendTokens with merchantName and source in metadata', async () => {
    await simulateCardPayment('u1', 20, 'My Merchant');
    expect(spendTokensMock).toHaveBeenCalledTimes(1);
    expect(spendTokensMock).toHaveBeenCalledWith('u1', 20, {
      merchantName: 'My Merchant',
      source: 'card_simulation',
    });
  });

  it('returns success, balance, merchantName and transactionId', async () => {
    const result = await simulateCardPayment('u1', 20, 'Test Store');
    expect(result).toEqual({
      success: true,
      balance: 80,
      merchantName: 'Test Store',
      transactionId: 'wt_sim_1',
    });
  });

  it('trims merchantName before passing to spendTokens', async () => {
    await simulateCardPayment('u1', 5, '  Trimmed  ');
    expect(spendTokensMock).toHaveBeenCalledWith('u1', 5, {
      merchantName: 'Trimmed',
      source: 'card_simulation',
    });
  });
});
