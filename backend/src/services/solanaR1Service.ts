/**
 * RUMI ONE (R1) SPL token on Solana: balance and broadcast.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import {
  rumiOneMint,
  solanaRpcUrl,
  r1Decimals,
  r1Symbol,
  r1Name,
  isR1Configured,
} from '../config/solana.js';

export interface R1BalanceResult {
  balance: string;
  balanceRaw: string;
  decimals: number;
  mint: string;
}

export interface R1TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Get R1 token metadata from config (for status endpoint).
 */
export function getR1TokenMetadata(): R1TokenMetadata | null {
  if (!isR1Configured()) return null;
  return {
    mint: rumiOneMint,
    symbol: r1Symbol,
    name: r1Name,
    decimals: r1Decimals,
  };
}

/**
 * Fetch R1 balance for a Solana wallet address via RPC.
 * Returns zero balance if ATA does not exist.
 */
export async function getR1Balance(walletAddress: string): Promise<R1BalanceResult | null> {
  if (!isR1Configured() || !walletAddress?.trim()) return null;
  try {
    const connection = new Connection(solanaRpcUrl);
    const mintPubkey = new PublicKey(rumiOneMint);
    const ownerPubkey = new PublicKey(walletAddress.trim());
    const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
    const account = await getAccount(connection, ata);
    const amount = account.amount;
    const divisor = 10 ** r1Decimals;
    const balance = (Number(amount) / divisor).toFixed(r1Decimals);
    return {
      balance,
      balanceRaw: amount.toString(),
      decimals: r1Decimals,
      mint: rumiOneMint,
    };
  } catch {
    return {
      balance: '0',
      balanceRaw: '0',
      decimals: r1Decimals,
      mint: rumiOneMint,
    };
  }
}

/**
 * Broadcast a client-signed Solana transaction (base64).
 * Returns signature on success.
 */
export async function broadcastSignedTransaction(
  signedTransactionBase64: string
): Promise<{ signature: string }> {
  if (!solanaRpcUrl) throw new Error('SOLANA_RPC_URL not configured');
  const connection = new Connection(solanaRpcUrl);
  const buf = Buffer.from(signedTransactionBase64, 'base64');
  const sig = await connection.sendRawTransaction(buf, { skipPreflight: false });
  return { signature: sig };
}
