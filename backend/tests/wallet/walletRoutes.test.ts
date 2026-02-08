/**
 * Wallet routes tests (Step 34): validation, error mapping, controller responses.
 * Auth and rate limit are mocked; services are mocked.
 */
import express from 'express';
import request from 'supertest';
import walletRoutes from '../../src/routes/walletRoutes.js';
import { WalletError } from '../../src/errors/WalletError.js';

jest.mock('../../src/middleware/auth.js', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId?: string }).userId = 'user-1';
    next();
  },
}));

jest.mock('../../src/middleware/walletRateLimit.js', () => ({
  walletRateLimit: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const mockGetWalletBalance = jest.fn();
const mockGetWalletTransactions = jest.fn();
const mockSpendTokens = jest.fn();
const mockTransferTokens = jest.fn();

jest.mock('../../src/services/walletService.js', () => ({
  getWalletBalance: (...args: unknown[]) => mockGetWalletBalance(...args),
  getWalletTransactions: (...args: unknown[]) => mockGetWalletTransactions(...args),
  spendTokens: (...args: unknown[]) => mockSpendTokens(...args),
  transferTokens: (...args: unknown[]) => mockTransferTokens(...args),
}));

const mockSimulateCardPayment = jest.fn();
jest.mock('../../src/services/cardSimulationService.js', () => ({
  simulateCardPayment: (...args: unknown[]) => mockSimulateCardPayment(...args),
}));

const app = express();
app.use(express.json());
app.use('/api/rumi-wallet', walletRoutes);

describe('walletRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWalletBalance.mockResolvedValue(100);
    mockGetWalletTransactions.mockResolvedValue([]);
    mockSpendTokens.mockResolvedValue({ balance: 90, transactionId: 'wt_123' });
    mockTransferTokens.mockResolvedValue({
      fromBalance: 90,
      toBalance: 110,
      transactionId: 'wt_456',
    });
    mockSimulateCardPayment.mockResolvedValue({
      success: true,
      balance: 80,
      merchantName: 'Test Shop',
      transactionId: 'wt_789',
    });
  });

  describe('GET /api/rumi-wallet/balance', () => {
    it('returns 200 and balance', async () => {
      const res = await request(app)
        .get('/api/rumi-wallet/balance')
        .expect(200);
      expect(res.body).toEqual({ success: true, balance: 100 });
      expect(mockGetWalletBalance).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /api/rumi-wallet/transactions', () => {
    it('returns 200 and transactions', async () => {
      const res = await request(app)
        .get('/api/rumi-wallet/transactions')
        .expect(200);
      expect(res.body).toEqual({ success: true, transactions: [] });
      expect(mockGetWalletTransactions).toHaveBeenCalledWith('user-1', 50, 0);
    });
  });

  describe('POST /api/rumi-wallet/spend', () => {
    it('returns 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/api/rumi-wallet/spend')
        .send({})
        .expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockSpendTokens).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is not positive', async () => {
      const res = await request(app)
        .post('/api/rumi-wallet/spend')
        .send({ amount: 0 })
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockSpendTokens).not.toHaveBeenCalled();
    });

    it('returns 200 and balance + transactionId when valid', async () => {
      const res = await request(app)
        .post('/api/rumi-wallet/spend')
        .send({ amount: 10, metadata: { ref: 'x' } })
        .expect(200);
      expect(res.body).toMatchObject({
        success: true,
        balance: 90,
        transactionId: 'wt_123',
      });
      expect(mockSpendTokens).toHaveBeenCalledWith('user-1', 10, { ref: 'x' });
    });

    it('returns 400 and code when service throws WalletError (e.g. insufficient funds)', async () => {
      mockSpendTokens.mockRejectedValueOnce(WalletError.insufficientFunds());
      const res = await request(app)
        .post('/api/rumi-wallet/spend')
        .send({ amount: 10 })
        .expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('POST /api/rumi-wallet/transfer', () => {
    it('returns 400 when toUserId is missing', async () => {
      await request(app)
        .post('/api/rumi-wallet/transfer')
        .send({ amount: 10 })
        .expect(400);
      expect(mockTransferTokens).not.toHaveBeenCalled();
    });

    it('returns 200 and balance + toBalance + transactionId when valid', async () => {
      const res = await request(app)
        .post('/api/rumi-wallet/transfer')
        .send({ toUserId: 'user-2', amount: 10 })
        .expect(200);
      expect(res.body).toMatchObject({
        success: true,
        balance: 90,
        toBalance: 110,
        transactionId: 'wt_456',
      });
      expect(mockTransferTokens).toHaveBeenCalledWith('user-1', 'user-2', 10, {});
    });
  });

  describe('POST /api/rumi-wallet/simulate-payment', () => {
    it('returns 400 when merchantName is missing', async () => {
      await request(app)
        .post('/api/rumi-wallet/simulate-payment')
        .send({ amount: 10 })
        .expect(400);
      expect(mockSimulateCardPayment).not.toHaveBeenCalled();
    });

    it('returns 200 and result with transactionId when valid', async () => {
      const res = await request(app)
        .post('/api/rumi-wallet/simulate-payment')
        .send({ merchantName: 'Test Shop', amount: 20 })
        .expect(200);
      expect(res.body).toMatchObject({
        success: true,
        balance: 80,
        merchantName: 'Test Shop',
        transactionId: 'wt_789',
      });
      expect(mockSimulateCardPayment).toHaveBeenCalledWith('user-1', 20, 'Test Shop');
    });
  });
});
