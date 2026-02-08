import { WalletError, WalletErrorCode } from '../errors/WalletError.js';

export interface WalletErrorResponse {
  statusCode: number;
  body: { error: string; code?: string };
}

/**
 * Maps WalletError (or unknown) to HTTP status and response body for wallet routes.
 * INSUFFICIENT_FUNDS, INVALID_TRANSFER, INVALID_AMOUNT → 400
 * WALLET_NOT_FOUND → 404
 * SYSTEM_ERROR / unknown → 500
 */
export function mapWalletError(err: unknown): WalletErrorResponse {
  if (err instanceof WalletError) {
    const walletErr = err;
    switch (walletErr.code) {
      case WalletErrorCode.INSUFFICIENT_FUNDS:
      case WalletErrorCode.INVALID_TRANSFER:
      case WalletErrorCode.INVALID_AMOUNT:
        return { statusCode: 400, body: { error: walletErr.message, code: walletErr.code } };
      case WalletErrorCode.WALLET_NOT_FOUND:
        return { statusCode: 404, body: { error: walletErr.message, code: walletErr.code } };
      case WalletErrorCode.SYSTEM_ERROR:
      default:
        return { statusCode: 500, body: { error: walletErr.message, code: walletErr.code } };
    }
  }
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return { statusCode: 500, body: { error: message } };
}
