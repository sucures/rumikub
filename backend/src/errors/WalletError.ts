/**
 * Wallet error codes for Rumi Wallet (Step 34).
 * Used by walletErrorMapper to return consistent HTTP status codes.
 */
export const WalletErrorCode = {
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_TRANSFER: 'INVALID_TRANSFER',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

export type WalletErrorCodeType = (typeof WalletErrorCode)[keyof typeof WalletErrorCode];

export class WalletError extends Error {
  readonly code: WalletErrorCodeType;

  constructor(code: WalletErrorCodeType, message: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    Object.setPrototypeOf(this, WalletError.prototype);
  }

  static insufficientFunds(message = 'Insufficient balance') {
    return new WalletError(WalletErrorCode.INSUFFICIENT_FUNDS, message);
  }

  static invalidTransfer(message = 'Invalid transfer') {
    return new WalletError(WalletErrorCode.INVALID_TRANSFER, message);
  }

  static invalidAmount(message = 'Invalid amount') {
    return new WalletError(WalletErrorCode.INVALID_AMOUNT, message);
  }

  static walletNotFound(message = 'Wallet not found') {
    return new WalletError(WalletErrorCode.WALLET_NOT_FOUND, message);
  }

  static systemError(message = 'A system error occurred') {
    return new WalletError(WalletErrorCode.SYSTEM_ERROR, message);
  }
}
