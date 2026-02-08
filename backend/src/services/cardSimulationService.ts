// Card Simulation Layer (Step 32 / Step 34 / Step 35.3)
import { WalletError } from '../errors/WalletError.js';
import { spendTokens } from './walletService.js';
import { notifySimulatedPayment } from './walletNotificationService.js';

export interface SimulatePaymentResult {
  success: boolean;
  balance: number;
  merchantName: string;
  transactionId: string;
}

function logSimulation(userId: string, amount: number, merchantName: string, transactionId: string) {
  if (process.env.NODE_ENV === 'production') {
    console.info(`[cardSimulation] userId=${userId} amount=${amount} merchant=${merchantName} transactionId=${transactionId}`);
  }
}

export async function simulateCardPayment(
  userId: string,
  amount: number,
  merchantName: string
): Promise<SimulatePaymentResult> {
  const trimmedMerchant = typeof merchantName === 'string' ? merchantName.trim() : '';
  if (!trimmedMerchant) throw WalletError.invalidAmount('merchantName is required');
  if (amount <= 0) throw WalletError.invalidAmount('Amount must be greater than 0');
  if (typeof amount !== 'number' || !Number.isFinite(amount)) throw WalletError.invalidAmount('Invalid amount');

  const meta = {
    merchantName: trimmedMerchant,
    source: 'card_simulation',
  };
  const { balance, transactionId } = await spendTokens(userId, amount, meta);
  notifySimulatedPayment(userId, amount, trimmedMerchant, transactionId);
  logSimulation(userId, amount, trimmedMerchant, transactionId);
  return {
    success: true,
    balance,
    merchantName: trimmedMerchant,
    transactionId,
  };
}
